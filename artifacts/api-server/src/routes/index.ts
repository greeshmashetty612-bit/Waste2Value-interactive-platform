import { Router, type IRouter } from "express";
import healthRouter from "./health";
import w2vRouter from "./w2v";

const router: IRouter = Router();

router.use(healthRouter);
router.use(w2vRouter);

export default router;
