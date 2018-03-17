#ifndef TESTENTITY_H_DEF
#define TESTENTITY_H_DEF


#include <string>
#include <vector>
#include <ientity.h>


class TestEntity : public soft::IEntity
{
public:
  SOFT_ENTITY_METADATA("TestEntity", "test", "0.1");
  
public:
  TestEntity();
  explicit TestEntity(std::string const &uuid);
  virtual ~TestEntity() = default;

  void save(soft::IDataModel *) const override;
  void load(soft::IDataModel const *) override;
  static IEntity* create (const std::string &uuid);
  std::vector<std::string> dimensions() const override;
  int getDimensionSize(std::string const &dim) const override;
  double a;
  std::vector<double> vec;
  std::string text;
};

#endif // TESTENTITY_H_DEF
