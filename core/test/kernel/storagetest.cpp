#include <memory>
#include <stdexcept>
#include <string>
#include <gtest/gtest.h>
#include <QtCore>

#include <soft.h>
#include <storage.h>
#include "testentity.h"

class StorageTest : public ::testing::Test {
protected:
  StorageTest()
  {}

  virtual ~StorageTest()
  {}

  virtual void SetUp(){
    doubleValue = 42.0;
    doubleVector = std::vector<double>({1.0, 2.0, 3.0, 4.0, 5.0});
    text = "this is a string";
  }

public:
  double doubleValue;
  std::vector<double> doubleVector;
  std::string text;

};

TEST_F(StorageTest, construct1)
{
  auto storage = new soft::Storage("json", "storagetest.json", "");
  ASSERT_TRUE(nullptr != storage);
  delete storage;
}
  
TEST_F(StorageTest, construct2)
{
  QString const filename = "storagetest.json";
  std::string uuid;
  {
    auto storage = new soft::Storage("json", qPrintable(filename), "");
    
    ASSERT_TRUE(nullptr != storage);
    
    TestEntity test;
    uuid = test.id();
    test.a = doubleValue;
    test.vec = doubleVector;
    test.text = text;
    storage->save(&test);
    delete storage;
  }
  
  {
    auto storage = new soft::Storage("json", qPrintable(filename), "");
    ASSERT_TRUE(storage != nullptr);
    TestEntity test(uuid);
    ASSERT_STREQ(test.id().c_str(), uuid.c_str());
    storage->load(&test);
    ASSERT_DOUBLE_EQ(test.a, doubleValue);
    ASSERT_STREQ(test.text.c_str(), text.c_str());
    ASSERT_EQ(test.vec.size(), doubleVector.size());
    for (int i = 0; i < test.vec.size(); ++i) {
      ASSERT_DOUBLE_EQ(test.vec[i], doubleVector[i]);
    }
  }  
}

