import Router from "@koa/router";
import { Like } from "typeorm";
import { User } from "../../../Models/user";
import { isLoggedIn } from "../../../Server/middleware";

const usersRouter = new Router();

usersRouter.get("/search", isLoggedIn, async (ctx) => {
    const users = await User.find({
        where: [
            {
                osu: {
                    userID: ctx.query.user,
                },
            },
            {
                osu: {
                    username: Like(`%${ctx.query.user}%`),
                },
            },
        ],
        take: 20,
    });

    ctx.body = users;
});

export default usersRouter;