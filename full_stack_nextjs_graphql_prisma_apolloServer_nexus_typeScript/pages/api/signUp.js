// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { gql, UserMutation } from "@apollo/client";

const USER_CREATE = gql`
  mutation SetMyUser($name: String!, $email: String!, $password: String!) {
    setMyUser(name: $name, email: $email, password: $password) {
      id
      name
      email
      password
    }
  }
`;

const [mutateFunction, { data, loading, error }] = UserMutation(USER_CREATE);

export default function handler(req, res) {
  if (req.method === "POST") {
    console.log(req.body);
    mutateFunction({ variables: { ...req.data } });
  }

  res.status(200).json({ name: "John Doe" });
}
