const router = require("express").Router();

router.use("/user", require("./users"));
router.use("/marker", require("./marker"));

module.exports = router;
