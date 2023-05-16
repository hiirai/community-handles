/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/server"
import { kv } from "@vercel/kv"

import { getAgent } from "@/lib/atproto"

export const size = {
  width: 800,
  height: 400,
}
export const contentType = "image/png"
export const runtime = "edge"

export default async function og({ params }: { params: { handle: string } }) {
  const value = await kv.get(params.handle + "." + process.env.DOMAIN)
  if (!value || typeof value !== "string") {
    return {
      title: "Profile not found",
      description: ":(",
    }
  }
  const agent = await getAgent()
  const profile = await agent.getProfile({
    actor: value,
  })

  const fetchAvatar = profile.data.avatar
    ? fetch(profile.data.avatar).then((res) => res.arrayBuffer())
    : Promise.resolve(null)
  const fetchBanner = profile.data.banner
    ? fetch(profile.data.banner).then((res) => res.arrayBuffer())
    : Promise.resolve(null)

  const [avatar, banner] = await Promise.all([fetchAvatar, fetchBanner])

  return new ImageResponse(
    (
      <div tw="flex flex-col w-full h-full bg-white">
        {banner && (
          <img // @ts-expect-error img behaves differently here
            src={banner}
            height="200"
            width="800"
            alt=""
          />
        )}
        <div tw="flex flex-row items-center flex-1 px-12">
          {avatar ? (
            <img // @ts-expect-error img behaves differently here
              src={avatar}
              height="150"
              width="150"
              tw="rounded-full"
              alt=""
            />
          ) : (
            <div tw="rounded-full bg-neutral-200 h-36 w-36" />
          )}
          <div tw="flex flex-col ml-6">
            {profile.data.displayName && (
              <p tw="m-0 text-4xl font-bold w-[500px]">
                {profile.data.displayName}
              </p>
            )}
            <p tw="mt-2 mb-0 text-neutral-500 text-2xl w-[500px]">
              @{profile.data.handle}
            </p>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
