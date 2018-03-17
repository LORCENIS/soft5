#include <system_error>
#include <cassert>
#include <string>
#include <stdexcept>
#include <QtCore>
#include <Soft>
#include "portooutput.h"
#include "reference.hxx"
#include "file.hxx"
#include "chemkinreaction.hxx"
#include "common.h"

//! Helper function to fetch entity labels of a given type (name,
//! namespace, version) from a \a collection
static std::list<std::string> findEntityLabels(soft::Collection const &collection,
					       std::string const &name,
					       std::string const &ns,
					       std::string const &version)
{
  std::list<std::string> entityLabels;
  auto const registeredEntityLabels = collection.findRelations("Entity", "^is-a");
  for (std::string const entityLabel : registeredEntityLabels) {    
    auto const names    = collection.findRelations(entityLabel, "name");
    auto const nss      = collection.findRelations(entityLabel, "namespace");
    auto const versions = collection.findRelations(entityLabel, "version");
    if (names.size() > 0 && nss.size() > 0 && version.size() > 0) {
      if (names.front() == name
	  && nss.front() == ns
	  && versions.front() == version){	
	entityLabels.push_back(entityLabel);
      }
    }
  }
  return entityLabels;
}

//! Helper function to look up the ID of a given \a label in a \a
//! collection
static std::string findUuid(soft::Collection const &collection, std::string const &label)
{
  auto const uuid = collection.findRelations(label, "id");
  if (uuid.size() != 1)
    throw std::runtime_error("Illegal collection");
  return uuid.front();
}
					       

PortoOutput :: PortoOutput(soft::Collection *collection, QObject *parent)
  : QObject(parent)
  , collection(collection)
{}

PortoOutput :: ~PortoOutput()
{}

void PortoOutput :: run()
{
  std::string metaName, metaVersion, metaNamespace, uuid;
  soft::Storage storage(const_global_driver, const_global_uri, const_global_options);
  collection->findEntity("dftBoundayFile", metaName, metaVersion, metaNamespace, uuid);
  QScopedPointer<soft::File> thermoFile(new soft::File(uuid));
  storage.load(thermoFile.data());
  assert(nullptr != thermoFile);

  // Setup for writing the data contents to a file
  QFileInfo thermoFileInfo(QDir::current(), QString::fromStdString(thermoFile->filename));
  {
    QFile outFile(thermoFileInfo.absoluteFilePath());
    if (!outFile.open(QIODevice::WriteOnly | QIODevice::Truncate)) {
        qWarning() << "Failed to write thermo file." << outFile.errorString();
        return;
    }
    // Write blob to file
    outFile.write((const char*)thermoFile->data.data(), (quint64)thermoFile->data.size());
    outFile.close();
  }
  // Verify that the termo file has indeed been created
  assert(thermoFileInfo.exists());
  
  auto chemfileRef = dynamic_cast<soft::Reference const*>(collection->findInstance("surfaceChemkinRef"));
  assert(nullptr != chemfileRef);
  // Verify that the surface file exists
  QFileInfo chemicalInfo(QString::fromStdString(chemfileRef->uri));
  assert(chemicalInfo.exists());

  // Copy the SurfaceChemkin to the same working directory we have thermo.dat
  QFile::copy(chemicalInfo.absoluteFilePath(), thermoFileInfo.absolutePath()+"/"+chemicalInfo.fileName());  

  // Run the external storage on the Chemkin file to read data into the entities.
  QString url = QString("chemkin://%1?chem=%2&thermo=%3")
    .arg(thermoFileInfo.absolutePath())
    .arg(chemicalInfo.fileName())
    .arg(thermoFileInfo.fileName());

  // Read the reactions from ChemkinCollection and register the relations in the collection
  soft::Collection chemkinCollection;
  QScopedPointer<soft::Storage> chemkinStorage (new soft::Storage("external", qPrintable(url), ""));
  chemkinCollection.setName("ChemkinCollection");
  chemkinCollection.setVersion("1.0-DEMO");
  chemkinStorage->load(&chemkinCollection);
  auto labels = findEntityLabels(chemkinCollection, "chemkinreaction", "eu.nanosim.vasp", "0.1");

  for (auto l : labels) {
    auto id = findUuid(chemkinCollection, l);
    collection->addRelation("reactiondata", "has-id", id);    
  }
  emit finished();
}

