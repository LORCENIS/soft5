#ifndef STORAGESTRATEGY_H_DEF
#define STORAGESTRATEGY_H_DEF

#include "softns.h"
#include "soft-kernel_export.h"

SOFT_BEGIN_NAMESPACE

class IDataModel;

class SOFT_KERNEL_EXPORT IStorageStrategy
{
public:
  IStorageStrategy(char const *, const char *) {};
  IStorageStrategy (IStorageStrategy const &) =delete;
  IStorageStrategy &operator=(IStorageStrategy const &) =delete;
  virtual ~IStorageStrategy() = default;

  virtual const char *metaType() const                    = 0;
  virtual IDataModel *dataModel () const                  = 0;
  virtual void        store     (IDataModel const *) const= 0;
  virtual void        startRetrieve (IDataModel *model)   = 0;
  virtual void        endRetrieve (IDataModel*) const {};

protected:
  IStorageStrategy() = default;
};

SOFT_END_NAMESPACE

#endif // STORAGESTRATEGY_H_DEF
