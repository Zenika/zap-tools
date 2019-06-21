import { ApolloServer, gql } from "apollo-server";
import fetch from "node-fetch";
import { computeCurrentCampaign } from "./survey";

const typeDefs = gql`
  type Mutation {
    respondToCurrentSurvey(response: ResponseValue): Response!
  }

  enum ResponseValue {
    GREAT
    NOT_SO_GREAT
    NOT_GREAT_AT_ALL
  }

  type Response {
    survey: Survey!
    value: ResponseValue!
  }

  type Query {
    currentSurvey: Survey!
  }

  type Survey {
    id: String!
    year: Int!
    month: Int!
    open: Boolean!
  }
`;

const resolvers = {
  Mutation: {
    async respondToCurrentSurvey(parent: any, args: any, context: any) {
      const survey = computeCurrentCampaign(new Date(), {
        enabled: true,
        startOn: 20,
        endOn: 5
      });
      if (!survey.open) {
        throw new Error("no survey open");
      }
      const response = await fetch("http://hasura:8080/v1/graphql", {
        method: "POST",
        body: JSON.stringify({
          query: `
            mutation validate_response($response: Int! $survey: String! $userId: Int!) {
              insert_humeur_votes(objects: {value: $response, survey: $survey, user_id: $userId}) {
                affected_rows
              }
            }
          `,
          variables: { response: 1, survey: survey.id, userId: 1 }
        })
      });
      if (response.ok) {
        const json = await response.json();
        if (!json.errors) {
          return {
            survey,
            value: args.response
          };
        } else {
          throw json.errors;
        }
      } else {
        throw new Error("non-200 response");
      }
    }
  },
  Query: {
    currentSurvey() {
      const survey = computeCurrentCampaign(new Date(), {
        enabled: true,
        startOn: 20,
        endOn: 5
      });
      return survey;
    }
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context({ req }) {
    return {
      headers: req.headers
    };
  }
});

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
