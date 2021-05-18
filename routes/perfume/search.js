var express = require("express");
var router = express.Router();

const authUtil = require("../../module/utils/authUtils");
const defaultRes = require("../../module/utils/utils");
const statusCode = require("../../module/utils/statusCode");
const resMessage = require("../../module/utils/responseMessage");
const db = require("../../module/pool");

/*
향수 리스트 검색
METHOD       : GET
URL  
*/

router.get("/", authUtil.isLoggedin, async (req, res, next) => {
  const p_name = req.query.p_name;
  var perfume_list = new Array();

  try {
    const selectPerfumeQuery =
      "SELECT * FROM Perfume WHERE p_name LIKE ? LIMIT 5";
    const selectPerfumeNotesQuery =
      "SELECT note FROM Perfume_notes WHERE p_idx = ?";

    const selectPerfumeResult = await db.queryParam_Parse(
      selectPerfumeQuery,
      `%${p_name}%`
    );

    for (var perfumeIndex in selectPerfumeResult) {
      const selectPerfumeNotesResult = await db.queryParam_Parse(
        selectPerfumeNotesQuery,
        selectPerfumeResult[perfumeIndex].p_idx
      );

      var perfume = {
        p_idx: "",
        p_name: "",
        brand: "",
        description: "",
        notes: [],
        image: "",
        similarity: 0,
        isScrapped: false,
      };

      perfume.p_idx = selectPerfumeResult[perfumeIndex].p_idx;
      perfume.p_name = selectPerfumeResult[perfumeIndex].p_name;
      perfume.brand = selectPerfumeResult[perfumeIndex].brand;
      perfume.description = selectPerfumeResult[perfumeIndex].description;

      selectPerfumeNotesResult.forEach((item) => {
        perfume.notes.push(item.note);
      });

      perfume.image = selectPerfumeResult[perfumeIndex].image;
      if (req.decoded != null) {
        const selectScrapPerfumeQuery =
          "SELECT * FROM Scrap WHERE p_idx = ? and u_idx = ?";
        const selectScrapPerfumeResult = await db.queryParam_Arr(
          selectScrapPerfumeQuery,
          [perfume.p_idx, req.decoded.u_idx]
        );

        if (selectScrapPerfumeResult[0] != null) {
          perfume.isScrapped = true;
        }
      }

      perfume_list.push(perfume);
    }

    res
      .status(200)
      .send(
        defaultRes.successTrue(
          statusCode.OK,
          resMessage.SUCCESS_SEARCH_PERFUME_LIST,
          perfume_list
        )
      );
  } catch (error) {
    res
      .status(200)
      .send(
        defaultRes.successFalse(
          statusCode.INTERNAL_SERVER_ERROR,
          resMessage.FAIL_SEARCH_PERFUME_LIST
        )
      );
  }
});

module.exports = router;
