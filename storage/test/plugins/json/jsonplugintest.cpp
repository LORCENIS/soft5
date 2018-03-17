#include <gtest/gtest.h>
#include <algorithm>
#include <Soft>

TEST(JSONPluginTest, driverAvailability)
{
  auto drivers = soft::registeredStorageDrivers();
  for (auto d : drivers) {
      std::cout << d << std::endl;
  }
  auto findIter = std::find(drivers.begin(), drivers.end(), "json");
  ASSERT_TRUE(findIter != drivers.end());  
}

TEST(JSONPluginTest, readWriteData)
{
  
  soft::Storage writeStorage("json", "output.json");
  auto writeStrategy = writeStorage.strategy();
  ASSERT_TRUE(writeStrategy != nullptr);
  auto writeModel = writeStrategy->dataModel();
  ASSERT_TRUE(writeModel != nullptr);
  writeModel->setId("49176f0a-24bb-4595-b109-5767169691b8");
  writeModel->setMetaName("Quazz");
  writeModel->setMetaVersion("2.0");
  writeModel->setMetaNamespace("http://www.sintef.no/ontology#");
  writeModel->appendDouble("d", 3.14);
  writeStrategy->store(writeModel);

  soft::Storage readStorage("json", "output.json");
  auto readStrategy = readStorage.strategy();
  ASSERT_TRUE(readStrategy != nullptr);

  auto readModel = readStrategy->dataModel();
  ASSERT_TRUE(readModel != nullptr);

  readModel->setId("49176f0a-24bb-4595-b109-5767169691b8");
  readStrategy->startRetrieve(readModel);
  double compare_d;
  readModel->getDouble("d", compare_d);
  readStrategy->endRetrieve(readModel);

  ASSERT_DOUBLE_EQ(compare_d, 3.14);
}

