const express = require("express");
var indexRouter = require('../index');
var advisorRouter = require('../advisor');
var organisationRouter = require('../organisation');
var investorRouter = require('../investor');
var transactionRouter = require('../transaction');
var adminRouter = require('../admin');
var subscriberRouter = require('../subscriber');
var notificationRouter = require('../notification');

module.exports = function(app) {
    app.use(express.json());
  
    app.use("/", indexRouter);
    app.use("/advisor", advisorRouter);
    app.use("/organisation", organisationRouter);
    app.use("/investor", investorRouter);
    app.use("/transaction", transactionRouter);
    app.use("/subscriber", subscriberRouter);
    app.use("/admin", adminRouter);
    app.use("/notification", notificationRouter);
};