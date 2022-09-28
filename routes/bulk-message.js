const express = require("express");
const router = express.Router();

app.post("/bulk-message", upload.single("xlsx"), async (req, res) => {

    let file = XLSX.readFile(req.file.path);
    let userMessage = await req.body.message;
    let index, limit, totalMessage, pointerMessage;
    index = 0;
    limit = 20;
    let data = [];
    const temp = XLSX.utils.sheet_to_json(file.Sheets[file.SheetNames[0]]);

    // *  Send message to all contacts
    connection.query(`select * from client_details where userID = 1 and userPassword = 'rudraasakariya'`, async (error, results, fields) => {
        if (results.length == 1) {
            totalMessage = results[0].message;
            if (totalMessage > 0 && totalMessage - data.length >= 0) {
                while (limit <= temp.length && totalMessage - data.length >= 0) {
                    let j;
                    for (j = index; j < limit; j++) {

                        temp[j].number = String("91" + temp[j].number + "@c.us");
                        data.push(temp[j].number);

                        if (j == limit - 1) {
                            if (totalMessage - data.length >= 0) {
                                connection.query(`update client_details set message = ${totalMessage - data.length} where userID = 1 and userPassword = 'rudraasakariya'`, (errors, results, fields) => {
                                    pointerMessage = totalMessage;
                                    totalMessage -= data.length;
                                });
                            }
                            else if (totalMessage > 0) {
                                data.length = totalMessage;
                                connection.query(`update client_details set message = ${totalMessage - data.length} where userID = 1 and userPassword = 'rudraasakariya'`, (errors, results, fields) => {
                                    pointerMessage = totalMessage;
                                    totalMessage -= data.length;
                                });
                            }
                            break;
                        }
                    }
                    
                    let point = 0;
                    while (totalMessage > 0 && point < data.length) {
                        CLIENT.sendText(data[point], `${point}`);
                        point++;
                    }

                    await sleep(1000);

                    if (j == limit - 1) {
                        data = [];
                        index = limit;
                        limit = limit + 20;

                        if (limit > temp.length) {
                            limit = index;
                            limit = limit + (temp.length - index);
                        }
                    }
                }
                res.json("The message was sent successfully");
                console.log(2);
            }
            else if (totalMessage > 0 && totalMessage - data.length < 0) {
                console.log("The message was not sent successfully");
                // res.send("Message limit reached");
            }
            else {
                res.json("The message was not sent successfully");
            }
        }
        else {
            res.status(500).send("Internal Server Error");
        }
    });

    fs.unlink(req.file.path, err => {
        if (err) {
            console.log(err);
        }
    });
});