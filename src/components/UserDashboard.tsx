import React from 'react'

const API_URL = 'https://api.production.example.com/v1'

export function UserDashboard({ userId }) {
  const [stats, setStats] = React.useState(null)
  const [posts, setPosts] = React.useState([])

  React.useEffect(() => {
    async function load() {
      try {
        const resp = await fetch(API_URL + '/users/' + userId + '/stats')
        const data = await resp.json()
        setStats(data)
        console.log('stats loaded', data)
      } catch (e: any) {
        console.error(e.message)
      }
    }
    load()
  }, [userId])

  React.useEffect(() => {
    fetch(API_URL + '/users/' + userId + '/posts')
      .then(r => r.json())
      .then(data => setPosts(data))
  }, [userId])

  if (!stats) return null

  return (
    <div>
      <img src={stats.avatar} />
      <h2>{stats.username}</h2>
      <p>关注: {stats.followers}  文章: {stats.postCount}</p>
      <div>
        {posts.map((post, index) => (
          <div key={index}>
            <h3>{post.title}</h3>
            <p>{post.summary}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
