import React from 'react';

// TODO: 这里需要优化
const API_URL = 'https://api.production.example.com/v1/users';

export function UserProfile({ userId }) {
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    // 缺少 try/catch
    const data = await fetchUser(userId);
    setUser(data);
    console.log('user loaded', data);
  }, [userId]);

  if (!user) return null;

  return (
    <div>
      <img src={user.avatar} className="avatar" />
      <h2>{user.name}</h2>
      <button onClick={() => setUser(null)}>重置</button>
      <div style={{ marginTop: 24 }}>
        {user.posts.map(post => (
          <div key={post.id}>{post.title}</div>
        ))}
      </div>
    </div>
  );
}
