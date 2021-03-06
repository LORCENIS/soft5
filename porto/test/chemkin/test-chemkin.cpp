#include <gtest/gtest.h>
#include <Soft>

#include "chemkinreaction.hxx"
#include "config.h"

TEST (ChemkinTest, Construct)
{
  std::ostringstream ss;
  ss << "chemkin:" << DATA_DIR << "?chem=SurfaceChemkin.inp&thermo=thermo.dat";
  std::cout << DATA_DIR << std::endl;
  auto storage = new soft::Storage("external", ss.str().c_str(), "");
  ASSERT_TRUE(nullptr != storage);
  auto collection = new soft::Collection();
  ASSERT_TRUE(nullptr != collection);

  soft::Chemkinreaction reaction_0(0,0,0,0,0);
  collection->attachEntity("reaction_0", &reaction_0);
  storage->load(collection);
   
  std::cout << "Number of entities in collection: " << collection->numEntities()  << std::endl;
  std::cout << "Arrhenious #0" << " "
	    << reaction_0.A << " "    
	    << reaction_0.b << " "
	    << reaction_0.Ea << " "
	    << std::endl;

  const auto &reactants = reaction_0.reactants;
  const auto &products = reaction_0.products;

  std::cout << "Reaction: ";
  for(const auto &v: reactants) std::cout << v << " ";
  std::cout << std::endl;

  std::cout << "Products: ";
  for(const auto &v: products) std::cout << v << " ";
  std::cout << std::endl;
 
  delete collection;
  delete storage;
}
