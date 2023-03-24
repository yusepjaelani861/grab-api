import axios from "axios";
import { Request, Response, NextFunction } from "express";
import fs from "fs";
import moment from "moment";

const errorHandler = async (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let message_error: any =
    "=====================================" +
    "\n" +
    "Date: " +
    new Date() +
    "\n" +
    "=====================================" +
    "\n" +
    "Error Code: " +
    err.error?.error_code +
    "\n" +
    "Error Message: " +
    err.message +
    "\n" +
    "Error Data:" +
    " \r" +
    err.stack +
    " \r" +
    "\n" +
    "=====================================" +
    "\n";
  fs.appendFile("error.log", message_error, function (err: any) {
    if (err) throw err;
  });

  try {
    if (typeof err !== "undefined" && err.error?.error_code == "NOT_MEMBER") {
      return res.status(401).json({
        success: false,
        message: err.message || "Not Found",
        data: err.data || null,
        error: {
          error_code: err.error?.error_code || "NOT_FOUND",
          error_data: err.error_data || null,
        },
      });
    }

    if (typeof err !== "undefined" && err.error?.error_code == "NOT_FOUND") {
      return res.status(err.status || 404).json({
        success: false,
        message: err.message || "Not Found",
        data: err.data || null,
        error: {
          error_code: err.error?.error_code || "NOT_FOUND",
          error_data: err.error_data || null,
        },
      });
    }

    if (
      typeof err !== "undefined" &&
      err.error?.error_code == "VALIDATION_ERROR"
    ) {
      let error_validation: any = {};

      err.error.error_data.forEach((element: any) => {
        error_validation[element.param] = [element.msg];
      });
      return res.status(err.status || 400).json({
        success: false,
        message: err.message || "Something went wrong",
        data: err.data || null,
        error: {
          error_code: err.error?.error_code || "PROCESS_ERROR",
          error_data: error_validation || null,
        },
      });
    }

    if (
      typeof err !== "undefined" &&
      err.error?.error_code == "PROCESS_ERROR"
    ) {
      return res.status(err.status || 400).json({
        success: false,
        message: err.message || "Something went wrong",
        data: err.data || null,
        error: {
          error_code: err.error?.error_code || "PROCESS_ERROR",
          error_data: err.error_data || null,
        },
      });
    }

    const errorCodeArray = [
      "PROCESS_ERROR",
      "VALIDATION_ERROR",
      "NOT_FOUND",
      "UNAUTHORIZED",
    ];
    if (
      typeof err !== "undefined" &&
      !errorCodeArray.includes(err.error?.error_code)
    ) {
      const message = `
Netzone Media Ticket
*Error Comun API Backend*
===========================
host: ${req.headers.host}
enviroment: ${process.env.NODE_ENV} 
time : ${moment().locale("id").format("LLLL")}
message: ${err?.message}
code: ${err?.error?.error_code}
data: ${JSON.stringify(err?.error?.error_data)}
===========================
    `;
    //   const response = await axios.post(
    //     `https://test.mitehost.my.id/api/20ca36496e2da44a9a2cd237548fd5dfea48d624/send`,
    //     {
    //       chatId: "-1001847863693",
    //       body: message,
    //     }
    //   );

      // console.log(response.data);
    }

    return res.status(err.status || 400).json({
      success: false,
      message: err.message || "Something went wrong",
      data: err.data || null,
      error: {
        error_code: err.error?.error_code || "PROCESS_ERROR",
        error_data: err.error_data || null,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      data: null,
      error: {
        error_code: "SERVER_ERROR",
        error_data: null,
      },
    });
  }
};

export default errorHandler;
