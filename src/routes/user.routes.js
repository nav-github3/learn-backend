import { Route } from "express";
import { registerUser} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";

const router = Route();


router.Route("/register").post(registerUser);


export default router; 