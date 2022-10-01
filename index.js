const wppconnect = require("@wppconnect-team/wppconnect");
const XLSX = require("xlsx");
const mysql = require("mysql");
const fs = require("fs");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const qrcode = require("qrcode");
const express = require("express");
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let CLIENT, qr;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let connection = mysql.createConnection({
    host: "108.179.246.70",
    port: "3306",
    user: "invenpyy_whatsapphatim",
    password: "1234567",
    database: "invenpyy_whatsappapihatim"
});

async function wpp(user, res) {
    let client = await wppconnect.create({
        session: user,
        catchQR: ((a, b, c, d) => {
            //* Use this for sending QR
            //* If session exists this block is skipped
            if (c == 1) {
                qrcode.toDataURL(d, async (err, data) => {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        await res.send('<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Document</title></head><body><img src="' + data + '"></img></body></html>');
                    }
                });
            }
        })
    });
    CLIENT = client;
}

app.get("/", (req, res) => {
    res.send("Hello");
});

app.post("/auth", async (req, res) => {
    let username = await req.body.username;
    let userPassword = await req.body.userPassword;
    let user = await req.body.sessionName;
    connection.query(`select * from client_details where userID = ${username} and userPassword = '${userPassword}'`, async (errors, results, fields) => {
        if (results.length == 1) {
            await wpp(user, res);
            connection.query(`update client_details set message = 100 where userID = "${username}" and userPassword = "${userPassword}"`, (errors, results, fields) => {
                // connection.end(function (err) {
                //     if (err) {
                //         console.log(err);
                //     }

                // });
            })
        }
        else {
            res.status(500).send("Internal Server Error");
        }

        if (errors) {
            res.send(errors);
        }
    });
});

app.post("/send-text", upload.none(), async (req, res) => {
    let username = await req.body.username;
    let userPassword = await req.body.userPassword;

    connection.query(`select * from client_details where userID = "${username}" and userPassword = "${userPassword}"`, async (error, results, fields) => {
        if (results.length == 1) {
            let totalMessage = results[0].message;
            if (totalMessage - 1 >= 0) {
                connection.query(`update client_details set message = ${totalMessage - 1} where userID = ${username} and userPassword = "${userPassword}"`);
                let number = await req.body.number;
                let message = await req.body.message;
                CLIENT.sendText("91" + number + "@c.us", message);
                res.status(200).send(message + " is sent successfully to " + number);
            }
            else {
                res.status(500).send("Internal Server Error");
            }
        }
        else {
            res.status(500).send("Internal Server Error");
            console.log("The errors are " + error);
        }
    });
});

// app.post("/sendTextBtn", async (req, res) => {
//     let number = await req.body.number;
//     let message = await req.body.message;
//     // let numberOfBtn = await req.body.numberOfBtn;
//     await CLIENT.sendText("91" + number + "@c.us", message, {
//         useTemplateButtons: false, // False for legacy
//         buttons: [
//             // {
//             //     url: "https://wppconnect.io/",
//             //     text: "WPPConnect Site"
//             // },
//             // {
//             //     phoneNumber: "+55 11 22334455",
//             //     text: "Call me"
//             // },
//             {
//                 id: "your custom id 1",
//                 text: "Some text"
//             },
//             {
//                 id: "another id 2",
//                 text: "Another text"
//             }
//         ],
//         title: "Title text", // Optional
//         footer: "Footer text" // Optional
//     });

//     await CLIENT.sendListMessage("91" + number + "@c.us", {
//         buttonText: "Click Me!", //required
//         description: "Hello it's list message", //required
//         title: "Hello user", //optional
//         footer: "Click and choose one", //optional
//         sections: [{
//             title: "Section 1",
//             rows: [{
//                 rowId: "rowid1",
//                 title: "Row 1",
//                 description: "Hello it's description 1",
//             }, {
//                 rowId: "rowid2",
//                 title: "Row 2",
//                 description: "Hello it's description 2",
//             }]
//         }]
//     });

//     res.status(200).send(message + " is sent successfully to " + number);
//     console.log(req.body.number);
// });

// app.post("/bulk-message", upload.single("xlsx"), async (req, res) => {

//     let file = XLSX.readFile(req.file.path);
//     let userMessage = await req.body.message;
//     let index, limit, totalMessage, pointerMessage;
//     index = 0;
//     limit = 20;
//     let data = [];
//     const temp = XLSX.utils.sheet_to_json(file.Sheets[file.SheetNames[0]]);

//     // *  Send message to all contacts
//     connection.query(`select * from client_details where userID = 1 and userPassword = 'rudraasakariya'`, async (error, results, fields) => {
//         if (results.length == 1) {
//             totalMessage = results[0].message;
//             if (totalMessage > 0 && totalMessage - data.length >= 0) {
//                 while (limit <= temp.length && totalMessage - data.length >= 0) {
//                     let j;
//                     for (j = index; j < limit; j++) {

//                         temp[j].number = String("91" + temp[j].number + "@c.us");
//                         data.push(temp[j].number);

//                         if (j == limit - 1) {
//                             if (totalMessage - data.length >= 0) {
//                                 connection.query(`update client_details set message = ${totalMessage - data.length} where userID = 1 and userPassword = 'rudraasakariya'`, (errors, results, fields) => {
//                                     pointerMessage = totalMessage;
//                                     console.log(pointerMessage);
//                                     totalMessage -= data.length;
//                                     console.log(totalMessage);
//                                 });
//                             }
//                             else if (totalMessage > 0) {
//                                 data.length = totalMessage;
//                                 connection.query(`update client_details set message = ${totalMessage - data.length} where userID = 1 and userPassword = 'rudraasakariya'`, (errors, results, fields) => {
//                                     pointerMessage = totalMessage;
//                                     console.log(pointerMessage);
//                                     totalMessage -= data.length;
//                                     console.log(totalMessage);
//                                 });
//                             }
//                             break;
//                         }
//                     }

//                     // for (let i = 0; i < data.length; i++) {
//                     //     CLIENT.sendText(data[i], `${i}`);
//                     // }
//                     let point = 0;
//                     while (totalMessage > 0 && point < data.length) {
//                         CLIENT.sendText(data[point], `${userMessage}`);
//                         point++;
//                     }

//                     await sleep(1000);

//                     if (j == limit - 1) {
//                         data = [];
//                         index = limit;
//                         limit = limit + 20;

//                         if (limit > temp.length) {
//                             limit = index;
//                             limit = limit + (temp.length - index);
//                         }
//                     }
//                 }
//                 res.json("The message was sent successfully");
//                 console.log(2);
//             }
//             else if (totalMessage > 0 && totalMessage - data.length < 0) {
//                 console.log("The message was not sent successfully");
//                 // res.send("Message limit reached");
//             }
//             else {
//                 res.json("The message was not sent successfully");
//             }
//         }
//         else {
//             res.status(500).send("Internal Server Error");
//         }
//     });

//     fs.unlink(req.file.path, err => {
//         if (err) {
//             console.log(err);
//         }
//     });
// });

// app.post("/group-extractor", async (req, res) => {
//     let groupName = req.body.groupName;
//     let groups = [], groupContacts = [], IDS = [], group;

//     groups = await CLIENT.getAllGroups();

//     for (let i = 0; i < groups.length; i++) {
//         if (groups[i].name === groupName) {
//             group = groups[i];
//             let participants = group.groupMetadata.participants;
//             for (let j = 0; j < participants.length; j++) {
//                 IDS.push(participants[j].id._serialized);
//             }
//         }
//     }

//     for (let i = 0; i < IDS.length; i++) {
//         let contactDetails = await CLIENT.getContact(IDS[i]);
//         let saveContactDetails = {
//             name: contactDetails.name,
//             pushname: contactDetails.pushname,
//             number: contactDetails.id.user,
//             isBusiness: contactDetails.isBusiness,
//             isEnterprise: contactDetails.isEnterprise,
//             isMe: contactDetails.isMe,
//             isMyContact: contactDetails.isMyContact,
//             isPSA: contactDetails.isPSA,
//             isUser: contactDetails.isUser,
//             isWAContact: contactDetails.isWAContact
//         }
//         groupContacts.push(saveContactDetails);
//     }
//     /* generate workbook object */
//     let ws = XLSX.utils.json_to_sheet(groupContacts);
//     let wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, `${groupName}.xlsx`);
//     /* generate buffer */
//     let buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
//     /* set headers */
//     res.attachment(`${groupName}.xlsx`);
//     /* respond with file data */
//     res.status(200).end(buf);
// });

app.post("/send-image", upload.single("image"), async (req, res) => {
    let username = await req.body.username;
    let userPassword = await req.body.userPassword;

    connection.query(`select * from client_details where userID = ${username} and userPassword = '${userPassword}'`, async (error, results, fields) => {
        if (results.length == 1) {
            let totalMessage = results[0].message;
            if (totalMessage - 1 >= 0) {
                connection.query(`update client_details set message = ${totalMessage - 1} where userID = ${username} and userPassword = '${userPassword}'`);
                if (req.file.mimetype == "image/jpg" || req.file.mimetype == "image/png" || req.file.mimetype == "image/jpeg") {
                    let number = await req.body.number;
                    let filename = await req.body.filename;
                    let caption = await req.body.caption;
                    await CLIENT.sendImage("91" + number + "@c.us", req.file.path, `${filename}`, `${caption}`);
                    fs.unlink(req.file.path, (err) => {
                        if (err) throw err;
                    });
                    res.status(200).send(caption + " is sent successfully to " + number);
                }
                else {
                    res.send("Send an image file .png , .jpg , .jpeg");
                }
            }
            else {
                res.status(500).send("Internal Server Error");
            }
        }
        else {
            res.status(500).send("Internal Server Error");
            console.log("The errors are " + error);
        }
    });
});

app.post("/send-document", upload.single("document"), async (req, res) => {
    let username = await req.body.username;
    let userPassword = await req.body.userPassword;

    connection.query(`select * from client_details where userID = ${username} and userPassword = '${userPassword}'`, async (error, results, fields) => {
        if (results.length == 1) {
            let totalMessage = results[0].message;
            if (totalMessage - 1 >= 0) {
                connection.query(`update client_details set message = ${totalMessage - 1} where userID = ${username} and userPassword = '${userPassword}'`);
                let number = await req.body.number;
                let filename = await req.body.filename;
                let caption = await req.body.caption;
                await CLIENT.sendFile("91" + number + "@c.us", req.file.path, { filename: filename, });
                fs.unlink(req.file.path, (err) => {
                    if (err) throw err;
                });
                res.status(200).send(caption + " is sent successfully to " + number);
            }
            else {
                res.status(500).send("Internal Server Error");
            }
        }
        else {
            res.status(500).send("Internal Server Error");
            console.log("The errors are " + error);
        }
    });
});

// app.post("/send-video", upload.single("video"), async (req, res) => {
//     let username = await req.body.username;
//     let userPassword = await req.body.userPassword;

//     connection.query(`select * from client_details where userID = ${username} and userPassword = '${userPassword}'`, async (error, results, fields) => {
//         if (results.length == 1) {
//             let totalMessage = results[0].message;
//             if (totalMessage - 1 >= 0) {
//                 connection.query(`update client_details set message = ${totalMessage - 1} where userID = ${username} and userPassword = '${userPassword}'`);
//                 let number = await req.body.number;
//                 let filename = await req.body.filename;
//                 let caption = await req.body.caption;
//                 CLIENT.sendFile("91" + number + "@c.us", req.file.path, { filename: filename, type: "video" });
//                 res.status(200).send(caption + " is sent successfully to " + number);
//             }
//             else {
//                 res.status(500).send("Internal Server Error");
//             }
//         }
//         else {
//             res.status(500).send("Internal Server Error");
//             console.log("The errors are " + error);
//         }
//     });
// });

// app.get("/create-user", async (req, res) => {
// let userID = Number(await req.body.userID);
// let userPassword = String(await req.body.userPassword);
// let clientID = Number(await req.body.clientID);
// let clientName = String(await req.body.clientName);
// let clientCompany = String(await req.body.clientCompany);
// let clientNumber = Number(await req.body.clientNumber);
// let validity = Number(await req.body.validity);
// let message = Number(await req.body.message);
// let messageRemaining = Number(await req.body.messageRemaining);
// let renewalDate = Number(await req.body.renewalDate);

// connection.query(`insert into client_details values(${userID},"${userPassword}",${clientID},"${clientName}","${clientCompany}",${clientNumber},${validity},${message} ,${messageRemaining},${renewalDate})`, function (error, results) {
//     if (error) throw error;
//     console.log("The solution is: ", results);
// });


// });

app.listen(process.env.PORT || 3000);