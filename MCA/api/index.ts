import "reflect-metadata";
import { App } from "../../Server";
import Mount from "koa-mount";
import UserRouter from "./routes/user";
import usersRouter from "./routes/users";
import beatmapsetsRouter from "./routes/beatmapsets";
import nominationsRouter from "./routes/nominations";
import votingRouter from "./routes/voting";
import staffRouter from "./routes/staff";
import indexRouter from "./routes";
import adminRouter from "./routes/admin/index";
import adminCategoriesRouter from "./routes/admin/categories";
import adminYearsRouter from "./routes/admin/years";
import adminResultsRouter from "./routes/admin/results";

const app = new App("mca");

app.koa.use(Mount("/", indexRouter.routes()));

app.koa.use(Mount("/user", UserRouter.routes()));
app.koa.use(Mount("/users", usersRouter.routes()));
app.koa.use(Mount("/beatmapsets", beatmapsetsRouter.routes()));

app.koa.use(Mount("/nominating", nominationsRouter.routes()));
app.koa.use(Mount("/voting", votingRouter.routes()));

app.koa.use(Mount("/staff", staffRouter.routes()));
app.koa.use(Mount("/admin", adminRouter.routes()));
app.koa.use(Mount("/admin/results", adminResultsRouter.routes()));
app.koa.use(Mount("/admin/categories", adminCategoriesRouter.routes()));
app.koa.use(Mount("/admin/years", adminYearsRouter.routes()));

export default {
    path: "/api",
    handler: app.koa.callback(),
};
