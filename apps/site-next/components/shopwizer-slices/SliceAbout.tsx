import styles from './shopwizer.module.css';

const teamMembers = [
  {
    name: 'Sarah Chen',
    role: 'Chief Executive Officer',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80',
  },
  {
    name: 'Michael Rodriguez',
    role: 'Head of Engineering',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&q=80',
  },
  {
    name: 'Emily Thompson',
    role: 'Head of Product',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&q=80',
  },
  {
    name: 'David Kim',
    role: 'Sr. Software Engineer',
    image: 'https://images.unsplash.com/photo-1600878459196-481d771e8d28?w=800&q=80',
  },
  {
    name: 'Jessica Martinez',
    role: 'Content Marketing Lead',
    image: 'https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?w=800&q=80',
  },
  {
    name: 'Ryan Patel',
    role: 'Software Engineer',
    image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=800&q=80',
  },
  {
    name: 'Amanda Foster',
    role: 'Sr. Product Manager',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&q=80',
  },
  {
    name: 'James Wilson',
    role: 'HR & Office Manager',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&q=80',
  },
];

export function SliceAbout() {
  return (
    <section className={styles.aboutSlice}>
      <div className={styles.missionSection}>
        <div className={styles.missionText}>
          <div className={styles.heroEyebrow}>Our Mission</div>
          <h2>Building the Future of E-commerce Recommendations</h2>
          <p>
            We're on a mission to help Shopify merchants increase their revenue through intelligent,
            AI-powered product recommendations that create personalized shopping experiences.
          </p>
          <p>
            To empower Shopify merchants of all sizes with enterprise-level AI recommendation
            technology that was previously only accessible to large corporations.
          </p>
        </div>
        <div className={styles.missionStats}>
          <div style={{ marginBottom: '40px' }}>
            <div className={styles.missionStat}>500M+</div>
            <div className={styles.statLabel}>Recommendations Served</div>
          </div>
          <div>
            <div className={styles.missionStat}>$2B+</div>
            <div className={styles.statLabel}>Revenue Generated</div>
          </div>
        </div>
      </div>

      <div className={styles.teamHeader}>
        <h2>Meet the team</h2>
      </div>

      <div className={styles.teamGrid}>
        {teamMembers.map((member, idx) => (
          <div key={idx} className={styles.teamMember}>
            <img src={member.image} alt={member.name} className={styles.teamPhoto} loading="lazy" />
            <div className={styles.teamInfo}>
              <div className={styles.teamName}>{member.name}</div>
              <div className={styles.teamRole}>{member.role}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
