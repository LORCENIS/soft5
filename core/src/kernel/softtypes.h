#ifndef SOFTTYPES_H_DEF
#define SOFTTYPES_H_DEF

#include <cstdint>
#include <cstdbool>
#include <vector>
#include "softns.h"
#include "variant.h"

SOFT_BEGIN_NAMESPACE
using StdString      = std::string;
using StdInt         = std::int32_t;
using StdUInt        = std::uint32_t;
using StdInt8        = std::int8_t;
using StdUInt8       = std::uint8_t;
using StdInt64       = std::int64_t;
using StdUInt64      = std::uint64_t;
using StdFloat       = float;
using StdDouble      = double;
using StdBool        = bool;
using StdBlob        = std::vector<unsigned char>;
using StdStringList  = std::vector<StdString>;
using StdIntArray    = std::vector<StdInt>;
using StdDoubleArray = std::vector<StdDouble>;

template <> struct VariantType<StdString>      {enum {value = 0};};
template <> struct VariantType<StdInt>         {enum {value = 1};};  
template <> struct VariantType<StdUInt>        {enum {value = 2};};
template <> struct VariantType<StdInt8>        {enum {value = 3};};
template <> struct VariantType<StdUInt8>       {enum {value = 4};};
template <> struct VariantType<StdInt64>       {enum {value = 5};};
template <> struct VariantType<StdUInt64>      {enum {value = 6};};
template <> struct VariantType<StdFloat>       {enum {value = 7};};
template <> struct VariantType<StdDouble>      {enum {value = 8};};
template <> struct VariantType<StdBool>        {enum {value = 9};};
template <> struct VariantType<StdBlob>        {enum {value = 10};};
template <> struct VariantType<StdStringList>  {enum {value = 11};};
template <> struct VariantType<StdIntArray>    {enum {value = 12};};
template <> struct VariantType<StdDoubleArray> {enum {value = 13};};

enum StdTypes { String = VariantType<StdString>::value,
		Int = VariantType<StdInt>::value,
		UInt = VariantType<StdUInt>::value,
		Int8 = VariantType<StdInt8>::value,
		UInt8 = VariantType<StdUInt8>::value,
		Int64 = VariantType<StdInt64>::value,
		UInt64 = VariantType<StdUInt64>::value,
		Float = VariantType<StdFloat>::value,
		Double = VariantType<StdDouble>::value,
		Bool = VariantType<StdBool>::value,
		Blob = VariantType<StdBlob>::value,
		StringList = VariantType<StdStringList>::value,
		IntArray = VariantType<StdIntArray>::value,
		DoubleArray = VariantType<StdDoubleArray>::value
};

using StdVariant = Variant<StdString,
  StdInt,
  StdUInt,
  StdInt8,
  StdUInt8,
  StdInt64,
  StdUInt64,
  StdFloat,
  StdDouble,
  StdBool,
  StdBlob,
  StdStringList,
  StdIntArray,
  StdDoubleArray>;

SOFT_END_NAMESPACE

#endif
