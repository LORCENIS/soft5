/****************************************************************************
 **
 ** Copyright (C) 2008 Nokia Corporation and/or its subsidiary(-ies).
 ** Contact: Qt Software Information (qt-info@nokia.com)
 **
 ** This file is part of the QSTestLib project.
 **
 ** This file may be used under the terms of the GNU General Public
 ** License version 2.0 or 3.0 as published by the Free Software Foundation
 ** and appearing in the file LICENSE.GPL included in the packaging of
 ** this file.  Please review the following information to ensure GNU
 ** General Public Licensing requirements will be met:
 ** http://www.fsf.org/licensing/licenses/info/GPLv2.html and
 ** http://www.gnu.org/copyleft/gpl.html.
 **
 ** If you are unsure which license is appropriate for your use, please
 ** contact the sales department at qt-sales@nokia.com.
 **
 ** This file is provided AS IS with NO WARRANTY OF ANY KIND, INCLUDING THE
 ** WARRANTY OF DESIGN, MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.
 **
 ****************************************************************************/

/*!
  QSTestLib, an auto-test library.

  To create a test, create an object with one or more functions.
  Each function is a testfunction in your test. Call QTest.exec()
  with your test object as argument to execute all its testfunctions.

  There are four special functions that are not treated
  as testfunctions, which your test object can define. They will be
  executed by the testing framework and can be used to initialize
  and clean up either the entire test or the current test function.

  initTestCase() will be called before the first testfunction is executed.
  cleanupTestCase() will be called after the last testfunction was executed.
  init() will be called before each testfunction is executed.
  cleanup() will be called after every testfunction.

  If initTestCase() fails, no testfunction will be executed. If
  init() fails, the following testfunction will not be executed,
  the test will proceed to the next testfunction.

  Example:

  \code
  var myTest = {
  name: "MySimpleTest",

  initTestCase: function() { print("called before everything else"); },

  myFirstTest: function() { qVerify(1 == 1); },

  mySecondTest: function() { qCompare(2, 2); },

  cleanupTestCase: function() { print("called after everything else"); }
  };
  \endcode

  From a testfunction, call qVerify() to check a condition;
  call qCompare() to compare two values; call qExpectFail()
  to mark the next qVerify() or qCompare() as an expected
  failure; call qSkip() to skip a test; call qFail() to
  force a test failure; and call qWarn() to report a warning.

  Testfunctions can be data-driven. The data associated with a
  testfunction must be defined in a property having the same
  name as the testfunction plus a _data suffix. Properties
  of the data object define "data tags", whose values are
  the arguments to pass to the testfunction. Example:

  \code
  indexingTest_data: { "1st element" : [0, 1]
  , "2nd element" : [1, 2] },

  indexingTest: function(index, expected) {
  var arr = Array(1, 2); qCompare(arr[index], expected);
  }
  \endcode

  The indexingTest() testfunction will be called two times;
  the first time with arguments index=0 and expected=1,
  and the second time with arguments index=1 and
  expected=2.

  If a _data property contains a function, that function will
  be called and the return value used as the data object; this
  makes it possible to generate data sets dynamically, just as
  the test function is about to be called.

  QTest uses an interface to report events pertaining to test
  execution; assigning an object to the property QTest.logger
  before calling QTest.exec() will cause events to be reported
  to that object. If no logger is defined, QSTestLib uses a
  default logger that uses print() to generate the test report
  as plain text.
  You can use QTest.xmlLogger to generate XML output instead.

  The logger interface is as follows:

  start(testcase): This function is called before any testfunction
  has been executed.

  enterTestFunction(testFunction): This function is called when a
  new test function is entered.

  leaveTestFunction(testFunction): This function is called when a
  test function is exited.

  compareFail(actual, expected, testFunction, dataTag, location):
  This function is called when a qCompare() fails.

  comparePropertyFail(name, actual, expected, testFunction, dataTag, location):
  This function is called when a qCompareProperties() fails.

  verifyFail(message, testFunction, dataTag, location):
  This function is called when a qVerify() fails.

  expectFail(comment, testFunction, dataTag, location):
  This function is called when a qCompare() or qVerify()
  expectedly fails.

  unexpectedPass(comment, testFunction, dataTag, location):
  This function is called when a qCompare() or qVerify()
  unexpectedly passes.

  skip(description, testFunction, dataTag, location):
  This function is called when a test is skipped.

  warn(message, testFunction, dataTag, location):
  This function is called when a warning is issued.

  pass(testFunction): This function is called when a test
  passes.

  end(testcase): This function is called after all testfunctions
  have been executed.

  The following variables are available to testfunctions and
  logger functions during testing:

  QTest.currentTestFunction: The name of the test function
  that is currently executed.

  QTest.currentDataTag: The name of the current test data.
  If the test doesn't have any assigned test data, this
  property is undefined.

  QTest.passCount: The number of test passes so far.
  QTest.failCount: The number of test failures so far.
  QTest.skipCount: The number of tests skipped so far.
*/

/*!
  Compares an \a actual value to an \a expected value. If the two
  arguments are equal, execution continues. If not, a failure is
  reported and the test won't be executed further.

  If \a comparefn is a function, it will be used to compare the
  \a actual and \a expected value; specifically, \a comparefn
  will be invoked with \a actual and \a expected as arguments,
  and is expected to return true if the two values are equal
  (by \a comparefn's definition of equal) and return false if
  the two values are not equal.

  If \a comparefn is not a function, QSTestLib's built-in
  comparison function will be used.
*/


qCompare = function(actual, expected, comparefn) {
    var passed = QTest._compare(actual, expected, comparefn);
    if (!passed) {
        var err = new Error();
        var loc = QTest._findLocation(err, "qCompare");
        if (!QTest._maybeExpectFail(loc)) {
            ++QTest.failCount;
            if (QTest._loggerImplements("compareFail")) {
                QTest.logger.compareFail(
                    actual, expected, QTest.currentTestFunction,
                    QTest.currentDataTag, loc);
            }
            QTest._fail(err);
        }
    } else {
        QTest._checkUnexpectedPass("qCompare");
    }
};

/*!
  Compares the properties of an \a actual object to the properties
  of an \a expected object. If all the properties are equal,
  execution continues. If not, a failure is reported and the test
  won't be executed further.
*/
qCompareProperties = function(actual, expected) {
    var passed = true;
    for (var pname in expected) {
        var val = expected[pname];
        if (!actual.hasOwnProperty(pname)
            || !QTest._compare(actual[pname], val)) {
            var err = new Error();
            var loc = QTest._findLocation(err, "qCompareProperties");
            if (!QTest._maybeExpectFail(loc)) {
                ++QTest.failCount;
                if (QTest._loggerImplements("comparePropertyFail")) {
                    QTest.logger.comparePropertyFail(
                        pname, actual, expected, QTest.currentTestFunction,
                        QTest.currentDataTag, loc);
                }
                QTest._fail(err);
            }
        }
    }
    if (passed)
        QTest._checkUnexpectedPass("qCompareProperties");
    return passed;
};

/*!
  Checks whether the \a condition is true or not. If it is true,
  execution continues. If not, a failure is reported with the given
  \a message and the test won't be executed further.
*/
qVerify = function(condition, message) {
    var passed = (condition === true);
    if (!passed) {
        var err = new Error();
        var loc = QTest._findLocation(err, "qVerify");
        if (!QTest._maybeExpectFail(loc)) {
            ++QTest.failCount;
            if (QTest._loggerImplements("verifyFail")) {
                QTest.logger.verifyFail(message, QTest.currentTestFunction,
                                        QTest.currentDataTag, loc);
            }
            QTest._fail(err);
        }
    } else {
        QTest._checkUnexpectedPass("qVerify");
    }
};

/*!
  Marks the next qCompare() or qVerify() as an expected failure. Instead of
  reporting a failure, an expected failure will be reported with the given
  \a comment.

  If a qCompare() or qVerify() is marked as an expected failure, but passes
  instead, an unexpected pass is reported.

  \a mode, if specified, describes whether the test should continue to execute
  (the default) or not.

  \a dataTag, if specified, describes for which entry in the test data the
  failure is expected.
*/
qExpectFail = function(comment, mode, dataTag) {
    QTest._expectFailInfo.comment = comment;
    QTest._expectFailInfo.mode = mode;
    QTest._expectFailInfo.dataTag = dataTag;
    QTest._expectFailInfo.valid = true;
};

/*!
  Stops execution of the test without reporting a failure. You
  can use it to skip tests that wouldn't make sense in the current
  configuration. \a mode, if specified, describes whether to
  proceed with the rest of the test data, or not (the default).
*/
qSkip = function(description, mode) {
    var err = new Error();
    var loc = QTest._findLocation(err, "qSkip");
    ++QTest.skipCount;
    if (QTest._loggerImplements("skip")) {
        QTest.logger.skip(description, QTest.currentTestFunction,
                          QTest.currentDataTag, loc);
    }
    err.skipped = true;
    err.mode = mode;
    QTest._fail(err);
};

/*!
  Forces a test failure. The failure is reported with the given
  \a message and the test stops executing.
*/
qFail = function (message) {
    var err = new Error();
    var loc = QTest._findLocation(err, "qFail");
    ++QTest.failCount;
    if (QTest._loggerImplements("fail")) {
        QTest.logger.fail(message, QTest.currentTestFunction,
                          QTest.currentDataTag, loc);
    }
    QTest._fail(err);
};

/*!
  Reports a warning with the given \a message.
*/
qWarn = function (message) {
    var err = new Error();
    var loc = QTest._findLocation(err, "qWarn");
    if (QTest._loggerImplements("warn")) {
        QTest.logger.warn(message, QTest.currentTestFunction,
                          QTest.currentDataTag, loc);
    }
};

(function(QTest){

    /*!
      \enum TestFailMode
      This enum describes the modes for handling an expected failure
      due to a qCompare() or qVerify().
    */
    QTest.Abort = 1;
    QTest.Continue = 2;

    /*!
      \enum SkipMode
      This enum describes the modes for skipping tests.
    */
    QTest.SkipSingle = 1;
    QTest.SkipAll = 2;

    /*!
      Executes tests defined in \a testcase.
      In addition, the functions initTestCase(), cleanupTestCase(), init()
      and cleanup() are executed if they exist.
    */
    QTest.exec = function(testcase) {
        if (QTest.logger == undefined)
            QTest.logger = QTest.plainTextLogger;
        if (QTest.writeln == undefined)
            QTest.writeln = print;

        QTest.passCount = 0;
        QTest.failCount = 0;
        QTest.skipCount = 0;

        QTest.currentTestFunction = undefined;
        QTest.currentDataTag = undefined;
        QTest._expectFailInfo = { valid: false };

        if (QTest._loggerImplements("start"))
            QTest.logger.start(testcase);

        if (QTest._executeTestFunction(testcase, "initTestCase")) {
            for (var p in testcase) {
                if (!testcase.hasOwnProperty(p)
                    || (p == "init") || (p == "cleanup")
                    || (p == "initTestCase") || (p == "cleanupTestCase")
                    || ((p.length > 4) && (p.slice(p.length-5) == "_data"))) {
                    continue;
                }
                QTest._executeTestFunction(testcase, p);
            }
        }

        QTest._executeTestFunction(testcase, "cleanupTestCase");

        if (QTest._loggerImplements("end"))
            QTest.logger.end(testcase);

        return (QTest.failCount == 0);
    };
    
    /*!
      The plain text logger.
    */
    QTest.plainTextLogger = {
        start: function(testcase) {
            var name = (testcase.name != undefined) ? testcase.name : "<noname>";
            QTest.writeln("********* Start testing of " + name + " *********");
        },

        compareFail: function(actual, expected, testFunction, dataTag, location) {
            var aquot = (typeof actual == "string") ? "\"" : "";
            var equot = (typeof expected == "string") ? "\"" : "";
            this._message("FAIL!", "Compared values are not the same:\n"
                          + "   Actual: " + aquot + actual.toString() + aquot + "\n"
                          + "   Expected: " + equot + expected.toString() + equot,
                          testFunction, dataTag, location);
        },

        comparePropertyFail: function(name, actual, expected, testFunction, dataTag, location) {
            var aquot = (typeof actual == "string") ? "\"" : "";
            var equot = (typeof expected == "string") ? "\"" : "";
            this._message("FAIL!", "Compared values of property \""
                          + name + "\" are not the same:\n"
                          + "   Actual: " + aquot + actual + aquot + "\n"
                          + "   Expected: " + equot + expected + equot,
                          testFunction, dataTag, location);
        },

        verifyFail: function(message, testFunction, dataTag, location) {
            var text = "Verify failed";
            if ((typeof message == "string") && (message.length != 0))
                text += ": " + message;
            this._message("FAIL!", text, testFunction, dataTag, location);
        },

        expectFail: function(comment, testFunction, dataTag, location) {
            this._message("XFAIL", comment, testFunction, dataTag, location);
        },

        unexpectedPass: function(comment, testFunction, dataTag, location) {
            this._message("XPASS", comment, testFunction, dataTag, location);
        },

        fail: function(message, testFunction, dataTag, location) {
            this._message("FAIL!", message, testFunction, dataTag, location);
        },

        skip: function(description, testFunction, dataTag, location) {
            this._message("SKIP ", description, testFunction, dataTag, location);
        },

        warn: function(message, testFunction, dataTag, location) {
            this._message("WARN ", message, testFunction, dataTag, location);
        },

        pass: function(testFunction) {
            this._message("PASS ", undefined, testFunction);
        },

        end: function(testcase) {
            QTest.writeln("Totals: "
                          + QTest.passCount + " passed, "
                          + QTest.failCount + " failed, "
                          + QTest.skipCount + " skipped");
            var name = (testcase.name != undefined) ? testcase.name : "<noname>";
            QTest.writeln("********* Finished testing of " + name + " *********");
        },

        _message: function(type, message, testFunction, dataTag, location) {
            var text = type + "  : " + testFunction;
            if (typeof dataTag == "string")
                text += "[" + dataTag + "]";
            if ((typeof message == "string") && (message.length != 0)) {
                text += " : " + message;
            }
            QTest.writeln(text);
            if (location != undefined)
                QTest.writeln("   Loc: " + location.fileName + "(" + location.lineNumber + ")");
        }
    };

    /*!
      The XML logger.
    */
    QTest.xmlLogger = {

        light: false,

        start: function(testcase) {
            var name = (testcase.name != undefined) ? testcase.name : "<noname>";
            if (!this.light) {
                QTest.writeln("<?xml version=\"1.0\" encoding=\"ISO-8859-1\"?>");
                QTest.writeln("<TestCase name=\"" + name + "\">");
            }
        },

        enterTestFunction: function(testFunction) {
            QTest.writeln("<TestFunction name=\"" + testFunction + "\">");
        },

        leaveTestFunction: function() {
            QTest.writeln("</TestFunction>");
        },

        compareFail: function(actual, expected, testFunction, dataTag, location) {
            var aquot = (typeof actual == "string") ? "\"" : "";
            var equot = (typeof expected == "string") ? "\"" : "";
            var description = "Compared values are not the same:\n"
                + "   Actual: " + aquot + actual.toString() + aquot + "\n"
                + "   Expected: " + equot + expected.toString() + equot;
            this._addIncident("fail", description, dataTag, location);
        },

        comparePropertyFail: function(name, actual, expected, testFunction, dataTag, location) {
            var aquot = (typeof actual == "string") ? "\"" : "";
            var equot = (typeof expected == "string") ? "\"" : "";
            var description = "Compared values of property \""
                + name + "\" are not the same:\n"
                + "   Actual: " + aquot + actual + aquot + "\n"
                + "   Expected: " + equot + expected + equot;
            this._addIncident("fail", description, dataTag, location);
        },

        verifyFail: function(message, testFunction, dataTag, location) {
            var text = "Verify failed";
            if ((typeof message == "string") && (message.length != 0))
                text += ": " + message;
            this._addIncident("fail", text, dataTag, location);
        },

        expectFail: function(comment, testFunction, dataTag, location) {
            this._addIncident("xfail", comment, dataTag, location);
        },

        unexpectedPass: function(comment, testFunction, dataTag, location) {
            this._addIncident("xpass", comment, dataTag, location);
        },

        fail: function(message, testFunction, dataTag, location) {
            this._addIncident("fail", message, dataTag, location);
        },

        skip: function(description, testFunction, dataTag, location) {
            this._addIncident("skip", description, dataTag, location);
        },

        warn: function(message, testFunction, dataTag, location) {
            this._addMessage("warn", message, dataTag, location);
        },

        pass: function(testFunction) {
            this._addIncident("pass");
        },

        end: function(testcase) {
            if (!this.light)
                QTest.writeln("</TestCase>");
        },

        _addIncident: function(type, description, dataTag, location) {
            var fn = (location == undefined) ? "" : location.fileName;
            var ln = (location == undefined) ? 0 : location.lineNumber;
            var xml = "<Incident type=\"" + type + "\" file=\"" + fn + "\" line=\"" + ln + "\">";
            if (dataTag != undefined)
                xml += "\n    <DataTag><![CDATA[" + dataTag + "]]></DataTag>";
            if (description != undefined)
                xml += "\n    <Description><![CDATA[" + description + "]]></Description>";
            xml += "\n</Incident>";
            QTest.writeln(xml);
        },

        _addMessage: function(type, message, dataTag, location) {
            var fn = (location == undefined) ? "" : location.fileName;
            var ln = (location == undefined) ? 0 : location.lineNumber;
            var xml = "<Message type=\"" + type + "\" file=\"" + fn + "\" line=\"" + ln + "\">";
            if (dataTag != undefined)
                xml += "\n    <DataTag><![CDATA[" + dataTag + "]]></DataTag>";
            if (message != undefined)
                xml += "\n    <Description><![CDATA[" + message + "]]></Description>";
            xml += "\n</Message>";
            QTest.writeln(xml);
        }
    };

    /*!
      The HTML logger.
    */
    QTest.htmlLogger = {

        light: false,

        start: function(testcase) {
            var name = (testcase.name != undefined) ? testcase.name : "<noname>";
            if (!this.light) {
                QTest.writeln("<html>");
                QTest.writeln("<head>");
                QTest.writeln("<title>" + name + "</title>");
                QTest.writeln("</title>");
                QTest.writeln("</head>");
            }
            QTest.writeln("<h1>Testcase: " + name + "</h1>");
            QTest.writeln("<table border=1 cellspacing=0 cellpadding=2>");
            QTest.writeln("<thead>");
            QTest.writeln("<tr align='center'>");
            QTest.writeln("<td><b>Incident</b></td>");
            QTest.writeln("<td><b>Test</b></td>");
            QTest.writeln("<td><b>Tag</b></td>");
            QTest.writeln("<td><b>Description</b></td>");
            QTest.writeln("<td><b>Location</b></td>");
            QTest.writeln("</tr>");
            QTest.writeln("</thead>");
        },

        compareFail: function(actual, expected, testFunction, dataTag, location) {
            var aquot = (typeof actual == "string") ? "\"" : "";
            var equot = (typeof expected == "string") ? "\"" : "";
            var description = "Compared values are not the same:\n"
                + "   Actual: " + aquot + actual.toString() + aquot + "\n"
                + "   Expected: " + equot + expected.toString() + equot;
            this._addIncident("fail", testFunction, description, dataTag, location);
        },

        comparePropertyFail: function(name, actual, expected, testFunction, dataTag, location) {
            var aquot = (typeof actual == "string") ? "\"" : "";
            var equot = (typeof expected == "string") ? "\"" : "";
            var description = "Compared values of property \""
                + name + "\" are not the same:\n"
                + "   Actual: " + aquot + actual + aquot + "\n"
                + "   Expected: " + equot + expected + equot;
            this._addIncident("fail", testFunction, description, dataTag, location);
        },

        verifyFail: function(message, testFunction, dataTag, location) {
            var text = "Verify failed";
            if ((typeof message == "string") && (message.length != 0))
                text += ": " + message;
            this._addIncident("fail", testFunction, text, dataTag, location);
        },

        expectFail: function(comment, testFunction, dataTag, location) {
            this._addIncident("xfail", testFunction, comment, dataTag, location);
        },

        unexpectedPass: function(comment, testFunction, dataTag, location) {
            this._addIncident("xpass", testFunction, comment, dataTag, location);
        },

        fail: function(message, testFunction, dataTag, location) {
            this._addIncident("fail", testFunction, message, dataTag, location);
        },

        skip: function(description, testFunction, dataTag, location) {
            this._addIncident("skip", testFunction, description, dataTag, location);
        },

        warn: function(message, testFunction, dataTag, location) {
            this._addMessage("warn", testFunction, message, dataTag, location);
        },

        pass: function(testFunction) {
            this._addIncident("pass", testFunction);
        },

        end: function(testcase) {
            QTest.writeln("</table>");
            QTest.writeln("<p>" + new Date());
            if (!this.light) {
                QTest.writeln("</body>");
                QTest.writeln("</html>");
            }
        },

        _addIncident: function(type, testFunction, description, dataTag, location) {
            var color;
            if (type == "pass")
                color = "00f700";
            else if (type == "fail")
                color = "f70000";
            else if (type == "xpass")
                color = "f7f700";
            if (color != undefined)
                QTest.writeln("<tr bgcolor='#" + color + "'>");
            else
                QTest.writeln("<tr>");
            QTest.writeln("<td><pre>" + type.toUpperCase() + "</pre></td>");
            QTest.writeln("<td><pre>" + testFunction + "</pre></td>");
            QTest.writeln("<td>" + ((dataTag == undefined) ? "&nbsp;" : "<pre>" + dataTag + "</pre>") + "</td>");
            QTest.writeln("<td>" + ((description == undefined) ? "&nbsp;" : "<pre>" + description + "</pre>") + "</td>");
            if (location == undefined)
                QTest.writeln("<td>&nbsp;</td>");
            else
                QTest.writeln("<td>" + location.fileName + ":" + location.lineNumber + "</td>");
            QTest.writeln("</tr>");
        },

        _addMessage: function(type, testFunction, message, dataTag, location) {
            QTest.writeln("<tr bgcolor='#f7c700'>");
            QTest.writeln("<td><pre>WARN</pre></td>");
            QTest.writeln("<td><pre>" + testFunction + "</pre></td>");
            QTest.writeln("<td>" + ((dataTag == undefined) ? "&nbsp;" : "<pre>" + dataTag + "</pre>") + "</td>");
            QTest.writeln("<td>" + ((message == undefined) ? "&nbsp;" : "<pre>" + message + "</pre>") + "</td>");
            if (location == undefined)
                QTest.writeln("<td>&nbsp;</td>");
            else
                QTest.writeln("<td>" + location.fileName + ":" + location.lineNumber + "</td>");
            QTest.writeln("</tr>");
        }
    };

    /*!
      \internal
    */
    QTest._executeTestFunction = function(testcase, fn) {
        var v = testcase[fn];
        if (typeof v != "function")
            return true;

        var data = testcase[fn + "_data"];
        if (typeof data == "function")
            data = data.apply(testcase);
        if (!(data instanceof Object)) {
            if (QTest._dummyData == undefined)
                QTest._dummyData = { "": [] }
            data = QTest._dummyData;
        }

        QTest.currentTestFunction = fn;
        if (QTest._loggerImplements("enterTestFunction"))
            QTest.logger.enterTestFunction(fn);
        var passed = true;
        var skip = false;
        var isInitOrCleanupTestCase = (fn == "initTestCase") || (fn == "cleanupTestCase");
        for (var tag in data) {
            if (!data.hasOwnProperty(tag))
                continue;
            var args = data[tag];
            if ((args != undefined) && !(args instanceof Array))
                args = [ args ];
            if (data === QTest._dummyData)
                tag = undefined;
            QTest.currentDataTag = tag;
            try {
                if ((typeof testcase["init"] == "function") && !isInitOrCleanupTestCase)
                    testcase.init();
                v.apply(testcase, args);
            } catch (e) {
                if ((typeof e != "object") || (e.name != "QTestFailure"))
                    throw e;
                passed = false;
                if (e.skipped)
                    skip = (e.mode == QTest.SkipAll);
            }
            if ((typeof testcase["cleanup"] == "function") && !isInitOrCleanupTestCase) {
                try {
                    testcase.cleanup();
                } catch (e) {
                    if ((typeof e != "object") || (e.name != "QTestFailure"))
                        throw e;
                    passed = false;
                    if (e.skipped)
                        skip = (e.mode == QTest.SkipAll);
                }
            }
            if (skip)
                break;
        }
        if (passed) {
            ++QTest.passCount;
            QTest.logger.pass(QTest.currentTestFunction);
        }
        if (QTest._loggerImplements("leaveTestFunction"))
            QTest.logger.leaveTestFunction(fn);
        return passed;
    };

    /*!
      \internal
    */
    QTest._isExpectFail = function() {
        return (QTest._expectFailInfo.valid === true)
            && ((QTest._expectFailInfo.dataTag == undefined)
                || (QTest.currentDataTag == QTest._expectFailInfo.dataTag));
    };

    /*!
      \internal
    */
    QTest._maybeExpectFail = function(location) {
        if (QTest._isExpectFail()) {
            QTest._expectFailInfo.valid = false;
            QTest.logger.expectFail(
                QTest._expectFailInfo.comment, QTest.currentTestFunction,
                QTest.currentDataTag, location);
            if (QTest._expectFailInfo.mode == QTest.Abort)
                QTest._fail(new Error());
            return true;
        }
        return false;
    };

    /*!
      \internal
    */
    QTest._checkUnexpectedPass = function(fn) {
        if (QTest._isExpectFail()) {
            QTest._expectFailInfo.valid = false;
            var err = new Error();
            var loc = QTest._findLocation(err, fn);
            ++QTest.failCount;
            QTest.logger.unexpectedPass(
                QTest._expectFailInfo.comment, QTest.currentTestFunction,
                QTest.currentDataTag, loc);
            if (QTest._expectFailInfo.mode == QTest.Abort)
                QTest._fail(err);
        }
    };

    /*!
      \internal
    */
    QTest._fail = function(err) {
        err.name = "QTestFailure";
        throw err;
    };

    /*!
      \internal
    */
    QTest._findLocation = function(e, fn) {
        var s = e.stack;
        if ((typeof s == "object") && (typeof s.length == "number")) {
            // assume Qt Script stack.
            for (var i = 0; i < s.length-1; ++i) {
                if (s[i].functionName == fn) {
                    return {
                        fileName: s[i+1].fileName,
                        lineNumber: s[i+1].lineNumber };
                }
            }
        } else if ((typeof s == "string")) {
            // assume SpiderMonkey stack.
            var lines = s.split("\n");
            for (var i = 0; i < lines.length-1; ++i) {
                var caps = /(.*)\(.*\)@(.*):(.*)/.exec(lines[i]);
                if ((caps != null) && (caps[1] == fn)) {
                    var caps = /(.*)\(.*\)@(.*):(.*)/.exec(lines[i+1]);
                    if (caps != null) {
                        return {
                            fileName: caps[2],
                            lineNumber: Number(caps[3]) };
                    }
                }
            }
        } else {
            // don't have stack info in this environment.
        }
        return undefined;
    };

    /*!
      \internal
    */
    QTest._loggerImplements = function(name) {
        return (typeof QTest.logger[name] == "function");
    }

    /*!
      \internal
    */
    QTest._compare = function(expect, actual, comparefn) {
        if (typeof comparefn == "function")
            return comparefn(expect, actual) ? true : false;

        if (actual != actual) {
            if (typeof actual == "object")
                actual = "NaN object";
            else
                actual = "NaN number";
        }
        if (expect != expect) {
            if (typeof expect == "object")
                expect = "NaN object";
            else
                expect = "NaN number";
        }

        var passed;
        if (typeof expect != typeof actual) {
            passed = false;
        } else {
            passed = (expect == actual) ? true : false;
            if (!passed && (typeof actual == "number")
                && (typeof expect  == "number")) {
                passed = Math.abs(actual - expect) < 0.0000001;
            }
        }

        return passed;
    };

    return QTest;
})(exports);
