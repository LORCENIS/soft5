#include <Soft>
#include <QtCore>

#include "common.h"
#include "remarc.h"
#include "portoinput.h"
#include "portooutput.h"

int main(int argc, char **argv)
{
  ::soft::init(argc, argv); 
  if (argc <= 2) {
    QTextStream(stderr) << "usage: " << argv[0] << "<path-to-remarc> <uuid>" << endl;
    return 1;
  }

  std::string const remarcPath(argv[1]);
  std::string const uuid(argv[2]);
  soft::Collection collection(uuid);
  collection.setName("DFTPrep");
  collection.setVersion("0.1");
  
  soft::Storage storage(const_global_driver, const_global_uri, const_global_options);
  storage.load(&collection);

  PortoInput *input = new PortoInput(&collection);
  Remarc *remarc = new Remarc(&collection, QString::fromStdString(remarcPath));
  PortoOutput *output = new PortoOutput(&collection);

  QObject::connect(input, SIGNAL(finished()), remarc, SLOT(run()));
  QObject::connect(input, SIGNAL(finished()), input, SLOT(deleteLater()));
  QObject::connect(remarc, SIGNAL(finished()), output, SLOT(run()));
  QObject::connect(remarc, SIGNAL(finished()), remarc, SLOT(deleteLater()));
  QObject::connect(output, SIGNAL(finished()), output, SLOT(deleteLater()));
  QObject::connect(output, SIGNAL(finished()), QCoreApplication::instance(), SLOT(quit()));

  input->run();

  return QCoreApplication::instance()->exec();
}
