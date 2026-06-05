import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import examsRouter from "./exams";
import questionsRouter from "./questions";
import enrollmentsRouter from "./enrollments";
import answersRouter from "./answers";
import violationsRouter from "./violations";
import resultsRouter from "./results";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(examsRouter);
router.use(questionsRouter);
router.use(enrollmentsRouter);
router.use(answersRouter);
router.use(violationsRouter);
router.use(resultsRouter);
router.use(dashboardRouter);

export default router;
