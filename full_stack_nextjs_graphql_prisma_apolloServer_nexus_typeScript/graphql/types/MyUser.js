import { objectType, extendType, nonNull, stringArg, booleanArg } from "nexus";
import * as bcrypt from "bcrypt";
import { validateEmail } from "../../utils/validate_email.ts";
import jwt from "jsonwebtoken";

export const MyUser = objectType({
  name: "MyUser",
  definition(t) {
    t.int("id");
    t.string("name");
    t.string("email");
    t.string("password");
    t.string("access_token");
  },
});

export const getMyUser = extendType({
  type: "Query",
  definition(t) {
    t.nonNull.list.field("getMyUser", {
      type: "MyUser",
      resolve(_Parent, _args, { db }) {
        return db.myUser.findMany();
      },
    });
  },
});

export const singUpUser = extendType({
  type: "Mutation",
  definition(t) {
    t.field("singUpUser", {
      type: "MyUser",
      args: {
        name: nonNull(stringArg()),
        email: nonNull(stringArg()),
        password: nonNull(stringArg()),
      },
      async resolve(_parent, args, { db }) {
        try {
          //================== password hash convert || email validation || email check and userCheck =====================//
          const hashPassword = await bcrypt.hash(args.password, 10);
          const valid = await validateEmail(args.email);
          const emailUse = await db.myUser.findMany({
            where: { email: args.email },
          });

          const nameUse = await db.myUser.findMany({
            where: { name: args.name },
          });

          if (nameUse?.length > 0) {
            throw Error("Name already Use");
          }

          if (emailUse?.length > 0) {
            throw Error("Email already Use");
          }

          if (!valid) {
            throw Error("email not valid ");
          }
          return await db.myUser.create({
            data: {
              name: args.name,
              password: hashPassword,
              email: args.email,
            },
          });
        } catch (error) {
          throw Error(error.message);
        }
      },
    });
  },
});

export const loginUser = extendType({
  type: "Query",
  definition(t) {
    t.field("loginUser", {
      type: "MyUser",
      args: {
        email: nonNull(stringArg()),
        password: nonNull(stringArg()),
      },
      async resolve(_parent, args, { db, user }) {
        //================ User check =========================//
        const isUser = await db.myUser.findMany({
          where: { email: args.email },
        });
        if (isUser.length > 0) {
          const isValidPassword = await bcrypt.compare(
            args.password,
            isUser[0]?.password
          );
          if (isValidPassword) {
            //============== generate token ========================//
            const token = jwt.sign(
              {
                username: isUser[0].name,
                id: isUser[0].id,
              },
              process.env.JWT_SECRET,
              { expiresIn: "2d" }
            );

            return { access_token: token };
          } else {
            throw Error("password not match");
          }
        } else {
          throw Error("User Not Found");
        }
        return isUser;
      },
    });
  },
});
