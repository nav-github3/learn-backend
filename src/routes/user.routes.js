import { Route } from "express";
import { UserController } from "../controllers/user.controller.js";
import User from "../models/user.model.js";

const router = Route();

router.route("/register").post(regiserUser);
