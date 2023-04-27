import { DaoProvider, Space } from '../type'
import axios from 'axios'
import { uniqBy } from 'lodash'
import blockedList from '../../public/dao/blocked-list.json'

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
      x => x.avatar &&
        x.followersCount > 499 &&
        x.validation.name !== 'any' &&
        x.twitter &&
        !blockedList.includes(x.id) &&
        (
          x.treasuries.length > 0 ||
          x.validation.params.minScore > 0 ||
          x.filters.onlyMembers ||
          x.filters.minScore > 0
        )
    ).map(x => ({
      spaceId: x.id,
      spaceName: x.name,
      twitterHandler: x.twitter,
      avatar: x.avatar,
      followersCount: x.followersCount
    }) as Space), x => x.spaceId)
  }
}
