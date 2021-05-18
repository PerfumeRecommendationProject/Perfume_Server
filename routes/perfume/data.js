var express = require("express");
var router = express.Router();

const authUtil = require("../../module/utils/authUtils");
const defaultRes = require("../../module/utils/utils");
const statusCode = require("../../module/utils/statusCode");
const resMessage = require("../../module/utils/responseMessage");
const db = require("../../module/pool");
const fs = require("fs");

/*
향수 데이터 등록
METHOD       : POST
URL          : /data
*/

router.post("/", async (req, res) => {
  var data = fs
    .readFileSync("final_perfume_data.csv", { encoding: "utf-8" })
    .toString();

  const rows = data.split("\r\n");
  const result = [];

  for (var rowIndex in rows) {
    var row = rows[rowIndex].split(",", -1);

    if (rowIndex === "0") {
      var columns = row;
    } else {
      var data = {};
      for (var columnIndex in columns) {
        var column = columns[columnIndex];
        data[column] = row[columnIndex];
      }
      result.push(data);
    }
  }

  for (var resultIndex in result) {
    const p_name = result[resultIndex].Name;
    const brand = result[resultIndex].Brand;
    const notes = result[resultIndex].Notes.split("#");
    // const description = result[resultIndex].Description.trim();
    const image = result[resultIndex].Image_URL;
    const description = result[resultIndex].Description;
    console.log(p_name);

    const insertPerfumeDataQuery =
      "INSERT INTO Perfume (p_name, brand, description, image) VALUES (?, ?, ?, ?)";

    const insertPerfumeNoteQuery =
      "INSERT INTO Perfume_notes (p_idx, note) VALUES (?, ?)";

    let insertPerfumeDataResult = await db.queryParam_Arr(
      insertPerfumeDataQuery,
      [p_name, brand, description, image]
    );
    //insertPerfumeDataResult = insertPerfumeDataResult;
    // console.log(insertPerfumeDataResult[0]);

    for (var noteIndex in notes) {
      const insertPerfumeNoteResult = await db.queryParam_Arr(
        insertPerfumeNoteQuery,
        [insertPerfumeDataResult.insertId, notes[noteIndex]]
      );
    }
  }
});

/*
향수 데이터 조회
METHOD       : GET
URL          : /perfume/{p_idx}
*/

router.get("/:p_idx", authUtil.isLoggedin, async (req, res, next) => {
  const p_idx = req.params.p_idx;
  var perfume = {
    p_idx: p_idx,
    p_name: "",
    brand: "",
    description: "",
    notes: [],
    image: "",
    similarity: 0,
    isScrapped: false,
  };

  try {
    const selectPerfumeQuery = "SELECT * FROM Perfume WHERE p_idx = ?";
    const selectPerfumeNotesQuery =
      "SELECT note FROM Perfume_notes WHERE p_idx = ?";

    const selectPerfumeResult = await db.queryParam_Parse(
      selectPerfumeQuery,
      p_idx
    );

    const selectPerfumeNotesResult = await db.queryParam_Parse(
      selectPerfumeNotesQuery,
      p_idx
    );

    perfume.p_name = selectPerfumeResult[0].p_name;
    perfume.brand = selectPerfumeResult[0].brand;
    perfume.description = selectPerfumeResult[0].description;

    selectPerfumeNotesResult.forEach((item) => {
      perfume.notes.push(item.note);
    });

    perfume.image = selectPerfumeResult[0].image;
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
    res
      .status(200)
      .send(
        defaultRes.successTrue(
          statusCode.OK,
          resMessage.SUCCESS_SELECT_PERFUME_DATA,
          perfume
        )
      );
  } catch (error) {
    res
      .status(200)
      .send(
        defaultRes.successFalse(
          statusCode.INTERNAL_SERVER_ERROR,
          resMessage.FAIL_SELECT_PERFUME_DATA
        )
      );
  }
});

module.exports = router;
