var express = require("express");
var router = express.Router();

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

module.exports = router;
