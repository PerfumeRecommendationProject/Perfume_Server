var express = require("express");
var router = express.Router();

const crypto = require("crypto-promise");

const authUtil = require("../../module/utils/authUtils");
const defaultRes = require("../../module/utils/utils");
const statusCode = require("../../module/utils/statusCode");
const resMessage = require("../../module/utils/responseMessage");
const db = require("../../module/pool");

/*
스크랩 변경
METHOD       : PUT
URL          : /scrap
BODY         : p_idx = 향수 고유 id(배열?)
               u_idx = 사용자 고유 id
               s_idx = 스크랩 고유 id (optional)
*/
router.put("/", authUtil.isLoggedin, async (req, res) => {
  const rec_perfume = req.body.p_idx;
  if (req.decoded == null) {
    return res
      .status(200)
      .send(
        defaultRes.successFalse(statusCode.BAD_REQUEST, resMessage.NULL_VALUE)
      );
  }

  if (req.body.s_idx) {
    const deleteScrapQuery = "DELETE FROM Scrap WHERE u_idx = ? and s_idx = ?";
    const deleteScrapResult = await db.queryParam_Arr(deleteScrapQuery, [
      req.decoded.u_idx,
      req.body.s_idx,
    ]);

    if (!deleteScrapResult) {
      res
        .status(200)
        .send(
          defaultRes.successFalse(statusCode.OK, resMessage.FAIL_DELETE_SCRAP)
        );
    } else {
      res
        .status(200)
        .send(
          defaultRes.successTrue(statusCode.OK, resMessage.SUCCESS_DELETE_SCRAP)
        );
    }
  } else {
    const insertScrapQuery =
      "INSERT INTO Scrap (u_idx, input_desc) VALUES (?, ?)";
    const insertScrapPerfumeQuery =
      "INSERT INTO Scrap_perfume (s_idx, p_idx) VALUES (?, ?)";

    const insertScrapResult = JSON.stringify(
      await db.queryParam_Arr(insertScrapQuery, [
        req.decoded.u_idx,
        req.body.input_desc,
      ])
    );
    //TODO: Scrap_perfume 테이블에 안들어감
    for (var index in rec_perfume) {
      const insertScrapPerfumeResult = await db.queryParam_Arr(
        insertScrapPerfumeQuery,
        [insertScrapResult[0].insertId, rec_perfume[index]]
      );
    }

    if (!insertScrapResult) {
      res
        .status(200)
        .send(defaultRes.successFalse(statusCode.OK, resMessage.FAIL_SCRAP));
    } else {
      res
        .status(200)
        .send(defaultRes.successTrue(statusCode.OK, resMessage.SUCCESS_SCRAP));
    }
  }
});

/*
스크랩 조회
METHOD       : GET
URL          : /scrap
*/
router.get("/", authUtil.isLoggedin, async (req, res, next) => {
  const selectScrapQuery = "SELECT * FROM Scrap WHERE u_idx = ?";
  const selectScrapPerfumeQuery = "SELECT * FROM Scrap_perfume WHERE s_idx = ?";
  const selectPerfumeQuery = "SELECT * FROM Perfume WHERE p_idx = ?";
  const selectPerfumeNotesQuery =
    "SELECT note FROM Perfume_notes WHERE p_idx = ?";
  const selectPerfumeBrandQuery = "SELECT * FROM Brand WHERE p_idx = ?";

  const selectScrapResult = await db.queryParam_Parse(
    selectScrapQuery,
    req.decoded.u_idx
  );

  if (!selectScrapResult) {
    res
      .status(200)
      .send(
        defaultRes.successFalse(statusCode.OK, resMessage.FAIL_SELECT_SCRAP)
      );
  } else {
    if (selectScrapResult[0] == null) {
      res
        .status(200)
        .send(
          defaultRes.successTrue(
            statusCode.OK,
            resMessage.NOT_EXIST_SCRAP,
            selectScrapResult
          )
        );
    } else {
      var scrapArray = new Array();

      var scrap = {
        input_desc: "",
        rec_perfume: [],
      };

      var perfume = {
        p_idx: "",
        p_name: "",
        brand: "",
        description: "",
        notes: "",
        image: "",
      };

      for (var i = 0; i < selectScrapResult.length; i++) {
        const selectScrapPerfumeResult = await db.queryParam_Parse(
          selectScrapPerfumeQuery,
          selectScrapResult[i].s_idx
        );

        for (var perfumeIndex in selectScrapPerfumeResult) {
          const selectPerfumeResult = await db.queryParam_Parse(
            selectPerfumeQuery,
            selectScrapPerfumeResult[perfumeIndex].p_idx
          );
          const selectPerfumeNotesResult = await db.queryParam_Parse(
            selectPerfumeNotesQuery,
            selectScrapPerfumeResult[perfumeIndex].p_idx
          );
          const selectPerfumeBrandResult = await db.queryParam_Parse(
            selectPerfumeBrandQuery,
            selectScrapPerfumeResult[perfumeIndex].p_idx
          );

          scrap.input_desc = selectScrapPerfumeResult[0].input_desc;
          perfume.p_idx = selectPerfumeResult[0].p_idx;
          perfume.p_name = selectPerfumeResult[0].p_name;
          perfume.brand = selectPerfumeBrandResult[0].b_name;
          perfume.description = selectPerfumeResult[0].description;
          perfume.notes = selectPerfumeNotesResult;
          perfume.image = selectPerfumeNotesResult[0].image;

          scrap.rec_perfume.push(perfume);
        }
        scrapArray.push(scrap);
      }
      res
        .status(200)
        .send(
          defaultRes.successTrue(
            statusCode.OK,
            resMessage.SUCCESS_SELECT_SCRAP,
            scrapArray
          )
        );
    }
  }
});

module.exports = router;
