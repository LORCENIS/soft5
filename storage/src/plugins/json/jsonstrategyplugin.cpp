#include <QTextStream>
#include "jsonstrategyplugin.h"

#include "soft.h"
#include "jsonstorage.h"

JSONStrategyPlugin :: ~JSONStrategyPlugin()
{}

void JSONStrategyPlugin :: registerStrategy()
{
  auto isOk = soft::registerStorage("json", soft::JSONStorage::create);
  if (!isOk) {
    QTextStream(stderr) << "Cannot register the json storage strategy" << endl;
  }
}
