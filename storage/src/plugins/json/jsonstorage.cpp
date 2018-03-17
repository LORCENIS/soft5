#include <QtCore>
#include "idatamodel.h"
#include "jsonstorage.h"

SOFT_BEGIN_NAMESPACE

#define NOT_IMPLEMENTED throw std::runtime_error("Not implemented");

const char *JSONStorage::staticMetaType = "http://sintef.no/soft/TR/storage-strategy#json:0.1-SNAPSHOT-2";

class JSONStorage::Private{
public:
  Private (QString const &uri = QString(), QString const &opt = QString())
    : uri(uri)
    , options(opt)
  {}

  QString uri;
  QString options;
  QString uuid;

  QJsonObject propertyObject;
  QJsonObject dimsObject;
  using DataModelMap = QMap<QString, IDataModel *>;
  DataModelMap dataModelMap;
};

JSONStorage :: JSONStorage ()
  : d(new JSONStorage::Private())
{}

JSONStorage :: JSONStorage(const char *uri, const char *options)
  :d(new JSONStorage::Private(uri, options))
{}

JSONStorage :: ~JSONStorage() = default;

const char *JSONStorage::metaType() const
{
  return JSONStorage::staticMetaType;
}

IDataModel *JSONStorage :: dataModel() const
{
  return dynamic_cast<IDataModel*>(new JSONStorage());
}

void JSONStorage :: store (IDataModel const *model) const
{
  JSONStorage const *storage = dynamic_cast<JSONStorage const *>(model);
  if (storage == nullptr) {
    QTextStream(stderr) << "Failed to store data. Incompatible model!" << endl;
    throw std::runtime_error("Failed to store data");
  }

  QUrl uri(d->uri);
  bool fileExists = QFile::exists(uri.path());
  QFile file(uri.path());
  QJsonDocument doc;
  QJsonObject baseObj;

  if (fileExists) { //Read old data if the file already existed
    if (!file.open(QIODevice::ReadOnly | QIODevice::Text)) {
      QTextStream(stderr) << "Cannot open file " << uri.path() << " for reading: " << file.errorString() << endl;
      throw std::runtime_error(file.errorString().toStdString());
    }
    if (file.size() > 0) {
      QJsonParseError jsonError;
      doc = QJsonDocument::fromJson(file.readAll(), &jsonError);
      if (jsonError.error != QJsonParseError::NoError) {
        QTextStream(stderr) << jsonError.errorString() << endl;
        throw std::runtime_error(jsonError.errorString().toStdString());
      }
    }
    file.close();
  }
  baseObj = doc.object();

  QJsonObject idObj;
  QJsonObject metaObject;
  metaObject.insert("name", storage->metaName().c_str());
  metaObject.insert("version", storage->metaVersion().c_str());
  metaObject.insert("namespace", storage->metaNamespace().c_str());
  idObj.insert("properties", storage->d->propertyObject);
  idObj.insert("dimensions", storage->d->dimsObject);
  idObj.insert("meta", metaObject);

  auto id = QString::fromStdString(storage->id());  
  baseObj.insert(id, idObj);
  doc.setObject(baseObj);

  if (!file.open(QIODevice::WriteOnly | QIODevice::Truncate | QIODevice::Text)){
    QTextStream(stderr) << "Cannot open file " << uri.path() << " for writing: " << file.errorString() << endl;
    throw std::runtime_error(file.errorString().toStdString());      
  }

  if (-1 == file.write(doc.toJson())) { // Write new contents
    QTextStream(stderr) << "Failed to write data :" << file.errorString() << endl;
    throw std::runtime_error(file.errorString().toStdString());
  }
  file.close();
}

void JSONStorage :: startRetrieve (IDataModel *model)
{
  JSONStorage *storage = dynamic_cast<JSONStorage *>(model);
  if (storage == nullptr) {
    QTextStream(stderr) << "Failed to store data. Incompatible model!" << endl;
    throw std::runtime_error("Failed to store data");
  }

  QUrl uri(d->uri);
  if (!QFile::exists(uri.path())) {
    QTextStream(stderr) << "Illegal filename: " << uri.path() << endl;
    throw (std::runtime_error("Illegal filename"));
  }

  QFile jsonFile(uri.path());
  if (!jsonFile.open(QIODevice::ReadOnly | QIODevice::Text)) {
    QTextStream(stderr) << "Illegal filename" << jsonFile.errorString() << endl;
    throw (std::runtime_error(jsonFile.errorString().toStdString()));
  }

  QByteArray const byteArray = jsonFile.readAll();
  QJsonParseError parseError;
  QJsonDocument const jsonDocument = QJsonDocument::fromJson(byteArray, &parseError);
  if (parseError.error != QJsonParseError::NoError) {
    QTextStream(stderr) << parseError.errorString() << endl;
    throw (std::runtime_error(parseError.errorString().toStdString()));
  }

  QJsonObject const baseObj = jsonDocument.object();
  auto it = baseObj.find(QString::fromStdString(storage->id()));
  if (it == baseObj.end()) {
    QTextStream(stderr) << "Requested UUID not in dataset" << endl;
    throw (std::runtime_error("Requested UUID not in dataset"));
  }

  QJsonObject const entityObj = (*it).toObject();
  storage->d->propertyObject = entityObj.value("properties").toObject();
  storage->d->dimsObject = entityObj.value("dimensions").toObject();
}

// @TODO replace with unique_ptr
IStorageStrategy* JSONStorage :: create(char const *uri, char const *opts)
{
  IStorageStrategy *strategy = dynamic_cast<IStorageStrategy*>(new JSONStorage(uri, opts));
  return strategy;
}

//
// IDataModel implementation
//

IDataModel * JSONStorage :: createModel()
{
  IDataModel * model = dynamic_cast<IDataModel*>(new JSONStorage());
  return model;
}

bool JSONStorage :: appendVariant (const char *key, StdVariant const &value)
{
  switch (value.type()) {
  case soft::StdTypes::String:
    d->propertyObject.insert(key, QJsonValue(QString::fromStdString(value.get<StdString>())));
    break;
  case soft::StdTypes::Int:
  case soft::StdTypes::UInt:
  case soft::StdTypes::Int8:
  case soft::StdTypes::UInt8:
  case soft::StdTypes::Int64:
  case soft::StdTypes::UInt64:
    d->propertyObject.insert(key, QJsonValue(value.toInt()));
    break;
  case soft::StdTypes::Double:
    d->propertyObject.insert(key, QJsonValue(value.get<StdDouble>()));
    break;
  case soft::StdTypes::DoubleArray:
    QJsonArray array;
    auto v = value.get<StdDoubleArray>();
    for (StdDoubleArray::iterator it = v.begin(); it != v.end(); ++it) {
      array.append(QJsonValue(*it));
    }
    d->propertyObject.insert(key, array);
    break;
  }
  return true;
}

bool JSONStorage :: appendString     (const char* key, const StdString &value)
{
  QJsonValue jsonValue(QString::fromStdString(value));
  auto it = d->propertyObject.insert(key, jsonValue);
  bool isOk = (it != d->propertyObject.end());
  return isOk;
}

bool JSONStorage :: appendInt8       (const char *key, StdInt8 value)
{
  QJsonValue jsonValue(value);
  auto it = d->propertyObject.insert(key, jsonValue);
  bool isOk = (it != d->propertyObject.end());
  return isOk;
}

bool JSONStorage :: appendUInt8      (const char *key, StdUInt8 value)
{
  QJsonValue jsonValue(value);
  auto it = d->propertyObject.insert(key, jsonValue);
  bool isOk = (it != d->propertyObject.end());
  return isOk;
}

bool JSONStorage :: appendInt16      (const char *key, StdInt16 value)
{
  QJsonValue jsonValue(value);
  auto it = d->propertyObject.insert(key, jsonValue);
  bool isOk = (it != d->propertyObject.end());
  return isOk;
}

bool JSONStorage :: appendUInt16     (const char *key, StdUInt16 value)
{
  QJsonValue jsonValue(value);
  auto it = d->propertyObject.insert(key, jsonValue);
  bool isOk = (it != d->propertyObject.end());
  return isOk;
}

bool JSONStorage :: appendInt32      (const char *key, StdInt value)
{
  QJsonValue jsonValue(value);
  auto it = d->propertyObject.insert(key, jsonValue);
  bool isOk = (it != d->propertyObject.end());
  return isOk;
}

bool JSONStorage :: appendUInt32     (const char *key, StdUInt value)
{
  QJsonValue jsonValue((int)value);
  auto it = d->propertyObject.insert(key, jsonValue);
  bool isOk = (it != d->propertyObject.end());
  return isOk;
}

bool JSONStorage :: appendInt64      (const char *key, StdInt64 value)
{
  QJsonValue jsonValue((int)value);
  auto it = d->propertyObject.insert(key, jsonValue);
  bool isOk = (it != d->propertyObject.end());
  return isOk;
}

bool JSONStorage :: appendUInt64     (const char *key, StdUInt64 value)
{
  QJsonValue jsonValue((int)value);
  auto it = d->propertyObject.insert(key, jsonValue);
  bool isOk = (it != d->propertyObject.end());
  return isOk;
}

bool JSONStorage :: appendFloat      (const char *key, StdFloat value)
{
  QJsonValue jsonValue(value);
  auto it = d->propertyObject.insert(key, jsonValue);
  bool isOk = (it != d->propertyObject.end());
  return isOk;
}

bool JSONStorage :: appendDimension (const char *key, StdUInt value)
{
  QJsonValue jsonValue((int)value);
  auto it = d->dimsObject.insert(key, jsonValue);
  bool isOk = (it != d->dimsObject.end());
  return isOk;
}

bool JSONStorage :: appendDouble (const char *key, StdDouble value)
{
  QJsonValue jsonValue(value);
  auto it = d->propertyObject.insert(key, jsonValue);
  bool isOk = (it != d->propertyObject.end());
  return isOk;
}

bool JSONStorage :: appendBool       (const char *key, bool value)
{
  QJsonValue jsonValue(value);
  auto it = d->propertyObject.insert(key, jsonValue);
  bool isOk = (it != d->propertyObject.end());
  return isOk;
}

bool JSONStorage :: appendInt32Array (const char *key, const StdIntArray &value)
{
  QJsonArray jsonArray;
  for (auto &v: value) {
    jsonArray.append(QJsonValue(v));
  }
  auto it = d->propertyObject.insert(key, jsonArray);
  bool isOk = (it != d->propertyObject.end());
  return isOk;
}

bool JSONStorage :: appendDoubleArray(const char *key, const StdDoubleArray &value)
{
  QJsonArray jsonArray;
  for (auto &v: value) {
    jsonArray.append(QJsonValue(v));
  }
  auto it = d->propertyObject.insert(key, jsonArray);
  bool isOk = (it != d->propertyObject.end());
  return isOk;
}

bool JSONStorage :: appendDoubleArray2D (const char *key, const StdDoubleArray2D& value)
{
  QJsonArray jsonArray;
  for (auto &v: value) {
    QJsonArray array;
    for (auto &d: v) {
      array.append(QJsonValue(d));
    }
    jsonArray.append(array);
  }
  auto it = d->propertyObject.insert(key, jsonArray);
  bool isOk = (it != d->propertyObject.end());
  return isOk;
}

bool JSONStorage :: appendDoubleArray3D (const char *key, const StdDoubleArray3D& value)
{
  QJsonArray jsonArray;
  for (auto &v: value) {
    QJsonArray aa;
    for (auto &a: v) {
      QJsonArray array;
      for (auto &d: a) {
        array.append(QJsonValue(d));
      }
      aa.append(array);
    }
    jsonArray.append(aa);
  }
  auto it = d->propertyObject.insert(key, jsonArray);
  bool isOk = (it != d->propertyObject.end());
  return isOk;
}


bool JSONStorage :: appendByteArray  (const char *, const std::vector<unsigned char> &)
{
  NOT_IMPLEMENTED;
  return false;
}

bool JSONStorage :: appendStringArray(const char *key, const std::vector<StdString> &value)
{
  QJsonArray jsonArray;
  for (auto &v: value) {
    jsonArray.append(QJsonValue(QString::fromStdString(v)));
  }
  auto it = d->propertyObject.insert(key, jsonArray);
  bool isOk = (it != d->propertyObject.end());
  return isOk;
}

bool JSONStorage :: appendArray      (const char *key, const IDataModel *dm)
{
  NOT_IMPLEMENTED;
  return false;
}

bool JSONStorage :: getDimension(const char *key, StdUInt &retValue) const
{
  QJsonValue value = d->dimsObject.value(key);
  if (!value.isDouble()) {
    throw std::runtime_error(QString("Error reading %1").arg(key).toStdString());    
    return false;
  }
  retValue = (StdUInt)value.toInt();
  return true;
}

bool JSONStorage :: getVariant(const char *key, StdVariant &) const
{
  NOT_IMPLEMENTED;
  return false;
}

bool JSONStorage :: getString(const char *key, StdString &retValue) const
{
  QJsonValue value = d->propertyObject.value(key);
  if (!value.isString()) {
    throw std::runtime_error(QString("Error reading %1").arg(key).toStdString());
    return false;
  }
  retValue = value.toString().toStdString();
  return true;
}

bool JSONStorage :: getInt8(const char *key, StdInt8 &retValue) const
{
  QJsonValue value = d->propertyObject.value(key);
  if (!value.isDouble()) {
    throw std::runtime_error(QString("Error reading %1").arg(key).toStdString());
    return false;
  }
  retValue = (StdInt8)value.toInt();
  return true;
}

bool JSONStorage :: getUInt8(const char *key, StdUInt8 &retValue) const
{
  QJsonValue value = d->propertyObject.value(key);
  if (!value.isDouble()) {
    throw std::runtime_error(QString("Error reading %1").arg(key).toStdString());
    return false;
  }
  retValue = (StdUInt8)value.toInt();
  return true;
}

bool JSONStorage :: getInt16(const char *key, StdInt16 &retValue) const
{
  QJsonValue value = d->propertyObject.value(key);
  if (!value.isDouble()) {
    throw std::runtime_error(QString("Error reading %1").arg(key).toStdString());
    return false;
  }
  retValue = (StdInt16)value.toInt();
  return true;
}

bool JSONStorage :: getUInt16(const char *key, StdUInt16 &retValue) const
{
  QJsonValue value = d->propertyObject.value(key);
  if (!value.isDouble()) {
    throw std::runtime_error(QString("Error reading %1").arg(key).toStdString());
    return false;
  }
  retValue = (StdUInt16)value.toInt();
  return true;
}

bool JSONStorage :: getInt32(const char *key, StdInt &retValue) const
{
  QJsonValue value = d->propertyObject.value(key);
  if (!value.isDouble()) {
    throw std::runtime_error(QString("Error reading %1").arg(key).toStdString());
    return false;
  }
  retValue = (StdInt)value.toInt();
  return true;
}

bool JSONStorage :: getUInt32(const char *key, StdUInt &retValue) const
{
  QJsonValue value = d->propertyObject.value(key);
  if (!value.isDouble()) {
    throw std::runtime_error(QString("Error reading %1").arg(key).toStdString());
    return false;
  }
  retValue = (StdUInt)value.toInt();
  return true;
}

bool JSONStorage :: getInt64(const char *key, StdInt64 &retValue) const
{
  QJsonValue value = d->propertyObject.value(key);
  if (!value.isDouble()) {
    throw std::runtime_error(QString("Error reading %1").arg(key).toStdString());
    return false;
  }
  retValue = (StdInt64)value.toInt();
  return true;
}

bool JSONStorage :: getUInt64(const char *key, StdUInt64 &retValue) const
{
  QJsonValue value = d->propertyObject.value(key);
  if (!value.isDouble()) {
    throw std::runtime_error(QString("Error reading %1").arg(key).toStdString());
    return false;
  }
  retValue = (StdUInt64)value.toInt();
  return true;
}

bool JSONStorage :: getFloat(const char *key, StdFloat &retValue) const
{
  QJsonValue value = d->propertyObject.value(key);
  if (!value.isDouble()) {
    throw std::runtime_error(QString("Error reading %1").arg(key).toStdString());
    return false;
  }
  retValue = (StdFloat)value.toDouble();
  return true;
}

bool JSONStorage :: getDouble(const char *key, StdDouble &retValue) const
{
  QJsonValue value = d->propertyObject.value(key);
  if (!value.isDouble()) {
    throw std::runtime_error(QString("Error reading %1").arg(key).toStdString());
    return false;
  }
  retValue = value.toDouble();
  return true;
}

bool JSONStorage :: getBool(const char *key, StdBool &retValue) const
{
  QJsonValue value = d->propertyObject.value(key);
  if (!value.isDouble()) {
    throw std::runtime_error(QString("Error reading %1").arg(key).toStdString());
    return false;
  }
  retValue = value.toBool();
  return true;
}

bool JSONStorage :: getInt32Array(const char *key, StdIntArray &retValue) const
{
  auto it = d->propertyObject.find(key);
  if (it == d->propertyObject.end()) return false;
  if (!(*it).isArray()) return false;
  QJsonArray array = (*it).toArray();
  retValue.resize(array.size());
  std::transform(array.begin(), array.end(), retValue.begin(), [](QJsonValue const &v){
      return v.toInt();
    });

  return true;
}

bool JSONStorage :: getDoubleArray(const char *key, StdDoubleArray &retValue) const
{
  auto it = d->propertyObject.find(key);
  if (it == d->propertyObject.end()) return false;
  if (!(*it).isArray()) return false;
  QJsonArray array = (*it).toArray();
  retValue.resize(array.size());
  std::transform(array.begin(), array.end(), retValue.begin(), [](QJsonValue const &v){
      return v.toDouble();
    });

  return true;
}

bool JSONStorage :: getDoubleArray2D(const char *key, StdDoubleArray2D &retValue) const
{
  auto it = d->propertyObject.find(key);
  if (it == d->propertyObject.end()) return false;
  if (!(*it).isArray()) return false;

  QJsonArray array = (*it).toArray();
  retValue.resize(array.size());
  std::transform(array.begin(), array.end(), retValue.begin(), [](QJsonValue const &arrayValue){
      if (!arrayValue.isArray()) throw std::runtime_error("Illegal array");
      QJsonArray jsonArray = arrayValue.toArray();
      StdDoubleArray insideArray(jsonArray.size());
      std::transform(jsonArray.begin(), jsonArray.end(), insideArray.begin(),[](QJsonValue const &v) {
          return v.toDouble();
        });
      return insideArray;
    });
  return true;
}

bool JSONStorage :: getDoubleArray3D(const char *key, StdDoubleArray3D &retValue) const
{
  auto it = d->propertyObject.find(key);
  if (it == d->propertyObject.end()) return false;
  if (!(*it).isArray()) return false;

  QJsonArray array = (*it).toArray();
  retValue.resize(array.size());
  std::transform(array.begin(), array.end(), retValue.begin(), [](QJsonValue const &arrayValue){
      if (!arrayValue.isArray()) throw std::runtime_error("Illegal array");
      QJsonArray jsonArray = arrayValue.toArray();
      StdDoubleArray2D insideArray(jsonArray.size());
      std::transform(jsonArray.begin(), jsonArray.end(), insideArray.begin(),[](QJsonValue const &arrayValue2) {
          if (!arrayValue2.isArray()) throw std::runtime_error("Illegal array");
          QJsonArray jsonArray2 = arrayValue2.toArray();
          StdDoubleArray insideArray2(jsonArray2.size());
          std::transform(jsonArray2.begin(), jsonArray2.end(), insideArray2.begin(), [](QJsonValue const &v) {
              if (!v.isDouble()) throw std::runtime_error("Illegal array");
              return v.toDouble();
            });
          return insideArray2;
        });
      return insideArray;
    });
  return true;
}

bool JSONStorage :: getByteArray(const char *key, StdBlob &retValue) const
{
  NOT_IMPLEMENTED;
  return false;
}

bool JSONStorage :: getStringArray(const char *key, StdStringList &retValue) const
{
  auto it = d->propertyObject.find(key);
  if (it == d->propertyObject.end()) return false;
  if (!(*it).isArray()) return false;

  QJsonArray array = (*it).toArray();
  retValue.resize(array.size());
  std::transform(array.begin(), array.end(), retValue.begin(), [](QJsonValue const &v){
      if (!v.isString()) throw std::runtime_error("Illegal value");
      return v.toString().toStdString();
    });

  return true;  
}

bool JSONStorage :: getArray(const char *key, IDataModel *) const
{
  NOT_IMPLEMENTED;
  return false;
}

IDataModel * JSONStorage :: getModel (const char *k) const 
{
  auto key = QString::fromLocal8Bit(k);
  if (d->dataModelMap.contains(key)) {
    return d->dataModelMap.value(key);
  }
  return nullptr;
}

bool JSONStorage :: appendModel (const char *k, IDataModel *model) 
{  
  auto key = QString::fromLocal8Bit(k);
  if (!d->dataModelMap.contains(key)) {
    d->dataModelMap.insert(key, model);
    return true;
  }
  return false;
} 

StdStringList JSONStorage :: getModelLabels() const
{
  StdStringList ret(d->dataModelMap.size());
  auto keys = d->dataModelMap.keys();
  std::transform(keys.begin(), keys.end(), ret.begin(),
                 [](QString &key) -> std::string {
                   return key.toStdString();
                 });

  return ret;
}



SOFT_END_NAMESPACE
