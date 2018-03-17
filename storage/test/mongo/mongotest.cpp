#include <gtest/gtest.h>
#include <iostream>
#include <mongoc.h>
#include <QMongo>

using soft::mongo::Client;
using namespace soft;
using bson::Bson;
using mongo::Uri;

class MongoTest : public ::testing::Test {
protected:
   static void SetUpTestCase() {
     Client::initialize();
      client = new mongo::Client("mongodb://localhost");
   }

   static void TearDownTestCase() {
   }

   virtual void SetUp() {
   }

   virtual void TearDown() {
   }

  static mongo::Client *client;
};

mongo::Client * MongoTest::client = nullptr;

TEST_F(MongoTest, bson_create) 
{
   Bson b1("{\"foo\":\"bar\"}");
   ASSERT_EQ(b1.countKeys(),1);
   ASSERT_TRUE(b1.asString() == "{ \"foo\" : \"bar\" }");
}

TEST_F(MongoTest, mongoclient_create) 
{
   auto collection = client->collection("test", "capi");
   ASSERT_TRUE(collection != nullptr);
}

TEST_F(MongoTest, client_collection) 
{
   auto collection = client->collection("test", "foo");
   ASSERT_TRUE (collection != nullptr);

   Bson ins("{\"foo2\":\"bar2\"}");
   Bson query("{\"foo2\":\"bar2\"}");

   collection->insert(&ins);
   ASSERT_EQ(collection->count(&query), 1);
   collection->drop();
   ASSERT_EQ(collection->count(&query), 0);
}

TEST_F(MongoTest, client_database)
{
   auto * database = client->database("soft");
   ASSERT_TRUE (database != nullptr);
}

TEST_F(MongoTest, client_uri) 
{
   auto uri = client->uri();
   ASSERT_TRUE(uri->string() == "mongodb://localhost");
}

TEST_F(MongoTest, client_writeConcern) 
{
   auto writeConcern = client->writeConcern();
   ASSERT_TRUE (writeConcern != nullptr);
}

TEST_F(MongoTest, collection_count)
{
   Bson query("{\"foo\":\"bar\"}");

   auto database = client->database("test");
   database->createCollection("foo");
   
   auto collection = client->collection("test", "foo");
   ASSERT_TRUE(collection != nullptr);
   
   collection->drop();
   ASSERT_TRUE(collection->count(&query) == 0);
 
   Bson ins("{\"foo\":\"bar\"}");

   collection->insert(&ins);
   collection->insert(&ins);
   collection->insert(&ins);
   ASSERT_TRUE(collection->count(&query) == 3);
   collection->drop();
   ASSERT_TRUE(collection->count(&query) == 0);
}

TEST_F(MongoTest, createIndex)
{
   auto database = client->database("test");
   database->createCollection("foo");

   Bson index("{\"foo\":1}");

   auto collection = client->collection("test", "foo");
   ASSERT_TRUE(collection != 0);
   bool ok = collection->createIndex( &index );
   ASSERT_TRUE(ok);
}

TEST_F(MongoTest, collection_drop)
{   
   auto database = client->database("test");
   database->createCollection("foo");
   
   auto collection = client->collection("test", "foo");
   ASSERT_TRUE(collection != nullptr);
   
   bool ok = collection->drop();
   ASSERT_TRUE(ok);
   ok = collection->drop();
   ASSERT_FALSE(ok);
}

TEST_F(MongoTest, collection_find)
{
   auto database = client->database("test");
   database->createCollection("foo");

   Bson query("{\"foo\":\"bar\"}");
   Bson fields("{}");


   auto collection = client->collection("test", "foo");
   ASSERT_TRUE(collection != 0);
   collection->drop();
   
   // insert objects that mach the query
   collection->insert(&query);
   collection->insert(&query);

   auto cur = collection->find(&query, &fields, 0);
   ASSERT_TRUE (cur != nullptr);
   ASSERT_TRUE (cur->more());
   
   int count = 0;

   ASSERT_TRUE(!cur->error());
      
   while(!cur->error() && cur->more())
   {
      auto next = cur->next();
      if (next)
         count++;
      else break;
   }
   ASSERT_EQ(count, 2);
}

TEST_F(MongoTest, lastError)
{
   auto * database = client->database("test");
   database->createCollection("foo");

   Bson query("{\"foo\":\"bar\"}");
   Bson sort;
   Bson update("{\"foo\":\"bay\"}");
   Bson fields;
   Bson* reply;
   bool remove = false;
   bool upsert = true;


   auto * collection = client->collection("test", "foo");
   ASSERT_TRUE(collection != 0);
   collection->drop();
   
   // insert objects that mach the update
   auto ok = collection->findAndModify(&query,
                             &sort,
                             &update,
                             &fields,
                             remove,
                             upsert,
                             &reply);

   ASSERT_TRUE( ok );
   auto cur = collection->find(&update, &fields, 0);
   ASSERT_TRUE (cur != nullptr);
   ASSERT_TRUE (cur->more());
   
   int count = 0;
   
   while((!cur->error()) && cur->more())
   {
      auto next = cur->next();
      if(next)
         count++;
      else break;
   }
   ASSERT_EQ(count, 1);
   delete reply;
}

TEST_F(MongoTest, collection_name)
{  
   auto database = client->database("test");
   database->createCollection("foo");
   auto collection = client->collection("test", "foo");
   ASSERT_TRUE(collection->name() == "foo");
}

TEST_F(MongoTest, collection_insert)
{
   auto database = client->database("test");
   database->createCollection("foo");

   Bson ins("{\"foo\":\"bar\"}");

   auto collection = client->collection("test", "foo");
   ASSERT_TRUE(collection != 0);
   bool ok = collection->insert(&ins);
   ASSERT_TRUE (ok);
}

TEST_F(MongoTest, collection_rename)
{
   auto database = client->database("test");
   auto collection = database->collection("foo");
   auto isOk = collection->rename("test2", "foo2", true);

   ASSERT_TRUE (isOk);   
}

TEST_F(MongoTest, collection_save)
{
  auto database = client->database("test");
  database->createCollection("foo");
  auto collection = client->collection("test", "foo");

  Bson doc("{\"foo\":\"baz\"}");
  bool ok = collection->save(&doc);
  ASSERT_TRUE( ok );
}


TEST_F(MongoTest, collection_update)
{
   auto database = client->database("test");
   database->createCollection("foo");

   Bson bson("{\"foo\":\"bar\"}");
   Bson upd("{\"foo\":\"baz\"}");
   Bson fields("{}");


   auto collection = client->collection("test", "foo");
   ASSERT_TRUE(collection != 0);
   collection->drop();
   
   collection->insert(&bson);
   collection->update(&bson, &upd);


   auto cur = collection->find(&upd, &fields, 0);
   ASSERT_TRUE (cur != nullptr);
   ASSERT_TRUE (cur->more());
   
   int count = 0;
   
   while((!cur->error()) && cur->more())
   {
      auto next = cur->next();
      if(next)
         count++;
      else
	break;
   }
   ASSERT_EQ(count, 1);
}

TEST_F(MongoTest, collection_validate)
{
   auto database = client->database("test");
   database->createCollection("foo");

   Bson ins("{\"foo\":\"bar\"}");

   auto collection = client->collection("test", "foo");
   ASSERT_TRUE(collection != 0);
   bool ok = collection->insert(&ins);
   ASSERT_TRUE (ok);
   Bson query("{}");
   auto reply = collection->validate(&query, ok);
   ASSERT_TRUE (ok);
}


TEST_F(MongoTest, cursor_current)
{
  auto database = client->database("test");
  database->createCollection("foo");

  Bson query("{\"foo\":\"bar\"}");
  Bson fields("{}");


  auto collection = client->collection("test", "foo");
  ASSERT_TRUE(collection != 0);
  collection->drop();
  
  // insert objects that mach the query
  const int N = 10;
  for(int i = 0; i < N; ++i)
     collection->insert(&query);

  auto cur = collection->find(&query, &fields, 0);
  ASSERT_TRUE (cur != nullptr);
  ASSERT_TRUE (cur->more());
  
  int count = 0;
  
  while((!cur->error()) && cur->more())
  {
     auto next = cur->next();
     auto curr = cur->current( );
     if(next) {
        count++;
        ASSERT_TRUE(next->asString() == curr->asString());
     } else {
       break;
     }
  }
  ASSERT_EQ(count, N);
}


TEST_F(MongoTest, cursor_isAlive)
{
  auto database = client->database("test");
  database->createCollection("foo");

  Bson query("{\"foo\":\"bar\""
    ",\"bla\",\"bvu7tvzufdtugjghgsjtu6265uffjf23jhgj2h3gj3g32jg3jgj32gj2gjg2g\"}");  // some trailing data
  Bson fields("{}");


  auto collection = client->collection("test", "foo");
  ASSERT_TRUE(collection != 0);
  collection->drop();
  
  // insert objects that mach the query
  const int N = 101;
  for(int i = 0; i < N; ++i)
     collection->insert(&query);

  auto cur = collection->find(&query, &fields, 0);
  ASSERT_TRUE (cur != nullptr);
  ASSERT_TRUE(cur->isAlive());
  ASSERT_TRUE (cur->more());
  
  int count = 0;
  
  while((!cur->error()) && cur->more())
  {
     auto next = cur->next();
     if(next)
          count++;
     else
       break;
  }
  ASSERT_EQ(count, N);
  ASSERT_TRUE(!cur->isAlive());
}


TEST_F(MongoTest, cursor_next)
{
  auto database = client->database("test");
  database->createCollection("foo");

  Bson query("{\"foo\":\"bar\"}");
  Bson fields("{}");


  auto collection = client->collection("test", "foo");
  ASSERT_TRUE(collection != 0);
  collection->drop();
  
  // insert objects that mach the query
  const int N = 101;
  for(int i = 0; i < N; ++i)
     collection->insert(&query);

  auto cur = collection->find(&query, &fields, 0);
  ASSERT_TRUE (cur != nullptr);
  ASSERT_TRUE (cur->more());
  
  int count = 0;
  
  while((!cur->error()) && cur->more())
  {
     auto next = cur->next();
     if(next) {
//	ASSERT_TRUE(next->asString() == "{ \"foo\" : \"bar\" }");
	count++;
     } else {
       break;
     }
  }
  ASSERT_EQ(count, N);
}


TEST_F(MongoTest, database_collection)
{
   auto database = client->database("test");
   auto coll = database->collection("foo");
   ASSERT_TRUE (coll != nullptr);
}

TEST_F(MongoTest, database_collectionNames)
{
   auto database = client->database("test");
   auto names = database->collectionNames();
   ASSERT_TRUE (names.length() > 0);
}

TEST_F(MongoTest, database_name)
{
  auto database = client->database("test");
  ASSERT_TRUE( database->name() == "test" ); 
}

TEST_F(MongoTest, database_add_user)
{
   auto database = client->database("test");
   auto ok = database->addUser ("bazinga", "secret");
   ASSERT_TRUE (ok);
}

TEST_F(MongoTest, database_remove_user)
{
   auto database = client->database("test");
   auto ok = database->removeUser ("bazinga");
   ASSERT_TRUE (ok);
}

TEST_F(MongoTest, database_remove_all_users)
{
   auto database = client->database("test");
   ASSERT_TRUE( true == database->addUser ("bazinga", "secret"));
   ASSERT_TRUE( true == database->addUser ("bing", "secret"));
   ASSERT_TRUE( true == database->addUser ("baz", "secret"));
   ASSERT_TRUE( true == database->addUser ("boose", "secret"));
   auto ok = database->removeAllUsers ();
   ASSERT_TRUE (ok);
}

TEST_F(MongoTest, database_drop)
{
  auto database = client->database("a_new_database");
  auto ok = database->drop();
  ASSERT_TRUE (ok);
}

TEST_F(MongoTest, mongoclient_gridfs)
{
  auto gridfs = client->gridFS("soft", "myprefix");
  ASSERT_TRUE (gridfs != nullptr);
}


TEST_F(MongoTest,gridFS_createFile)
{
   auto gridfs = client->gridFS("test", "testprefix");
   ASSERT_TRUE(gridfs != nullptr);
   auto gridfs_file = new mongo::GridFSFile(gridfs);
   ASSERT_TRUE(gridfs_file != nullptr);
}


TEST_F(MongoTest, GridFSFile_filename)
{
   auto gridfs = client->gridFS("test", "testprefix");
   ASSERT_TRUE(gridfs != nullptr);
   
   mongo::GridFSFileOpt gridfsopt(/*md5:*/"1234567890", /*filename:*/"testfile");
   auto gridfs_file = new mongo::GridFSFile(gridfs, &gridfsopt);
   ASSERT_TRUE(gridfs_file != nullptr);
   auto filename = gridfs_file->filename();
   ASSERT_TRUE( filename == "testfile" );
   delete gridfs_file;
}

TEST_F(MongoTest, GridFSFile_md5)
{
   auto gridfs = client->gridFS("test", "testprefix");
   ASSERT_TRUE(gridfs != nullptr);
   
   mongo::GridFSFileOpt gridfsopt(/*md5:*/"1234567890", /*filename:*/"testfile");
   auto gridfs_file = new mongo::GridFSFile(gridfs, &gridfsopt);
   ASSERT_TRUE(gridfs_file != nullptr);
   auto md5 = gridfs_file->md5();
   ASSERT_TRUE( md5 == "1234567890" );
   delete gridfs_file;
}


TEST_F(MongoTest, GridFSFile_save)
{
   auto gridfs = client->gridFS("test", "testprefix");
   ASSERT_TRUE(gridfs != nullptr);
   
   mongo::GridFSFileOpt gridfsopt;
   auto gridfs_file = new mongo::GridFSFile(gridfs, &gridfsopt);
   ASSERT_TRUE(gridfs_file != nullptr);
   auto ok = gridfs_file->save();
   ASSERT_TRUE( ok );
   delete gridfs_file;
}

TEST_F(MongoTest, GridFSFile_setMd5)
{
   auto gridfs = client->gridFS("test", "testprefix");
   ASSERT_TRUE(gridfs != nullptr);
   
   mongo::GridFSFileOpt gridfsopt;
   auto gridfs_file = new mongo::GridFSFile(gridfs, &gridfsopt);
   ASSERT_TRUE(gridfs_file != nullptr);
   gridfs_file->setMd5( "12345678" );
   auto md5 = gridfs_file->md5();
   ASSERT_TRUE( md5 == "12345678" );
   delete gridfs_file;
}


TEST_F(MongoTest, URI_copy)
{
  auto uri = new Uri("mongodb://localhost/bazinga"); 
  ASSERT_TRUE(uri != nullptr);

  auto copy = uri->copy();
  ASSERT_TRUE(copy->database() == "bazinga");  
}

TEST_F(MongoTest, URI_database)
{
  auto uri = new Uri("mongodb://localhost/bla"); 
  ASSERT_TRUE(uri != nullptr);
  ASSERT_TRUE(uri->database() == "bla");
  delete uri;
}

TEST_F(MongoTest, URI_hosts)
{
  auto uri = new Uri("mongodb://compu1,compu2/bla"); 
  ASSERT_TRUE(uri != nullptr);
  auto hosts = uri->hosts();
  ASSERT_TRUE(hosts.size() == 2 && hosts[1] == "compu2");
  delete uri;
}

TEST_F(MongoTest, URI_options)
{
  auto uri = new Uri("mongodb://compu1,compu2/bla?myopts=baz"); 
  ASSERT_TRUE(uri != nullptr);
  auto options = uri->options();
  ASSERT_TRUE(options.asString() == "{ \"myopts\" : \"baz\" }");
  delete uri;
}

TEST_F(MongoTest, URI_password)
{
  auto uri = new Uri("mongodb://user:secret@compu1/bla?myopts=baz"); 
  ASSERT_TRUE(uri != nullptr);
  auto password = uri->password();
  ASSERT_TRUE(uri->password() == "secret");
  delete uri;
}

TEST_F(MongoTest, URI_ssl)
{
   auto uri = new Uri("mongodb://compu1,compu2/bla?myopts=baz"); 
   auto hasSsl = uri->ssl();

   ASSERT_TRUE(uri != nullptr);
   ASSERT_EQ(hasSsl, false);
   
   delete uri;
}

TEST_F(MongoTest, URI_string)
{
  auto uri = new Uri("mongodb://user:secret@compu1/bla?myopts=baz"); 
  ASSERT_TRUE(uri != nullptr);
  ASSERT_TRUE(uri->string() == "mongodb://user:secret@compu1/bla?myopts=baz");
  delete uri;
}

TEST_F(MongoTest, URI_username)
{
  auto uri = new Uri("mongodb://user:secret@compu1/bla?myopts=baz"); 
  ASSERT_TRUE(uri != nullptr);
  auto username = uri->username();
  ASSERT_TRUE(username == "user");
  delete uri;
}

TEST_F(MongoTest, URI_new)
{
  auto uri = new Uri("mongodb://localhost/test"); 
  ASSERT_TRUE(uri != nullptr);
  delete uri;
}

TEST_F(MongoTest, WriteConcern_w)
{
  auto wconc = new mongo::WriteConcern;
  ASSERT_TRUE(wconc != nullptr);
  wconc->setW(-1);
  qint32 w = wconc->w();
  ASSERT_EQ(w, -1);
  delete wconc;
}

TEST_F(MongoTest, WriteConcern_new)
{
  auto wconc = new mongo::WriteConcern;
  ASSERT_TRUE(wconc != nullptr);
  delete wconc;
}

TEST_F(MongoTest, WriteConcern_setW)
{
  auto wconc = new mongo::WriteConcern;
  ASSERT_TRUE(wconc != nullptr);
  wconc->setW(123456);
  qint32 w = wconc->w();
  ASSERT_EQ(w, 123456);
  delete wconc;
}

