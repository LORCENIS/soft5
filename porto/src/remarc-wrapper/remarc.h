#pragma once
#include <QObject>
#include <collection.h>

class QProcess;
class Remarc : public QObject
{
  Q_OBJECT
  
public:  
  Remarc(soft::Collection *, QString const &remarcPath, QObject *parent = nullptr);
  virtual ~Remarc();

public slots:
  void run();
  void exited();
  void started();
  void readStdout();
  void readStderr();

signals:
  void finished();
  
private:
  QProcess *process;
  QString remarcPath;
  soft::Collection *collection;
};
