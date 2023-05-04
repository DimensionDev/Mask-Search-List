import { DaoProvider, Space } from '../type'
import axios from 'axios'
import { uniqBy } from 'lodash'
import * as verifyList_ from '../../public/dao/verify-list.json'

const verifyList: { [key: string]: number } = verifyList_

interface RawSpace {
  id: string,
  name: string,
  avatar: string,
  twitter: string,
  followersCount: number,
  filters: {
    minScore: number,
    onlyMembers: boolean
  },
  validation: {
    name: string,
    params: {
      minScore: number,
    }
  }
  treasuries: { name: string, address: string }[]
}

export class DAO implements DaoProvider {
  async getSpaces(): Promise<Space[]> {
    const allSettled = await Promise.allSettled(Array.from(Array(14)).map(async (x, i) => {
      return axios.post<{
        data: {
          spaces: RawSpace[]
        }
      }>('https://hub.snapshot.org/graphql', {
        operationName: "Spaces",
        query: `
          query Spaces {
            spaces(
              first: 1000,
              skip: ${i * 1000},
              orderDirection: asc
            ) {
              id
              name
              filters {
                minScore
                onlyMembers
              }
              avatar
              twitter
              followersCount
              validation {
                params
                name
              }
              treasuries {
                name
                address
              }
            }
          }      
        `,
        variables: null
      })
    }))

    const rawSpaces = allSettled.flatMap(
      (x) => (x.status === 'fulfilled' ? x.value.data.data.spaces ?? undefined : undefined)
    ).filter(x => x) as RawSpace[]

    return uniqBy(rawSpaces.filter(
      x => verifyList[x.id] !== -1 && (x.followersCount > 999 || verifyList[x.id] === 1)
    ).map(x => ({
      spaceId: x.id,
      spaceName: x.name,
      twitterHandler: x.twitter,
      avatar: x.avatar,
      followersCount: x.followersCount,
      isVerified: verifyList[x.id] === 1
    }) as Space), x => x.spaceId)
  }
}
