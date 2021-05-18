var express = require("express");
var router = express.Router();

// 향수 데이터 등록
router.use("/data", require("./data"));
router.use("/search", require("./search"));
router.use("/recommend/new", require("./recommend/new"));
router.use("/recommend/based", require("./recommend/based"));

module.exports = router;
