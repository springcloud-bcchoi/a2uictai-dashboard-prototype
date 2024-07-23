import {PrismaClient} from "@prisma/client";

const db = new PrismaClient();


// async function test() {
//   const users = await db.user.findMany({
//     where: {
//       username: {
//         contains: 'ff'
//       }
//     }
//   });
//   console.log(users);
// }
//

// async function test() {
//   const token = await db.sMSToken.findUnique({
//     where: {
//       id: 5
//     },
//     include: {
//       user: true,
//     },
//   });
//   console.log(token);
// }
//
// test();


export default db;