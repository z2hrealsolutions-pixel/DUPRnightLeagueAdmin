import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pastFaceoffs, setPastFaceoffs] = useState(false)
  const [togglingPast, setTogglingPast] = useState(false)

  useEffect(() => { loadStats() }, [])

  async function loadStats() {
    setLoading(true)
    const [teams, players, groupMatchups, subMatches, settings] = await Promise.all([
      supabase.from('teams').select('id', { count: 'exact', head: true }),
      supabase.from('players').select('id', { count: 'exact', head: true }),
      supabase.from('matchups').select('id, status').eq('stage', 'group'),
      supabase.from('sub_matches').select('id, done'),
      supabase.from('app_settings').select('show_past_faceoffs').single(),
    ])
    const matchups = groupMatchups.data || []
    const subs = subMatches.data || []
    setStats({
      teamCount: teams.count || 0,
      playerCount: players.count || 0,
      matchupsScheduled: matchups.length,
      matchupsComplete: matchups.filter(m => m.status === 'complete').length,
      subMatchesTotal: subs.length,
      subMatchesDone: subs.filter(s => s.done).length,
    })
    setPastFaceoffs(settings.data?.show_past_faceoffs || false)
    setLoading(false)
  }

  async function togglePastFaceoffs() {
    setTogglingPast(true)
    const newValue = !pastFaceoffs
    const { error } = await supabase.from('app_settings').update({ show_past_faceoffs: newValue }).eq('id', true)
    setTogglingPast(false)
    if (error) { alert(error.message); return }
    setPastFaceoffs(newValue)
  }

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of the DUPR Night League, Season 1</p>
      </div>

      {loading ? (
        <div className="loading-note">Loading…</div>
      ) : (
        <div className="card-grid">
          <div className="stat-card">
            <div className="num">{stats.teamCount}</div>
            <div className="label">Teams</div>
          </div>
          <div className="stat-card">
            <div className="num">{stats.playerCount}</div>
            <div className="label">Players</div>
          </div>
          <div className="stat-card">
            <div className="num">{stats.matchupsComplete} / {stats.matchupsScheduled}</div>
            <div className="label">Group Face-offs Complete</div>
          </div>
          <div className="stat-card">
            <div className="num">{stats.subMatchesDone} / {stats.subMatchesTotal}</div>
            <div className="label">Sub-matches Scored</div>
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 20 }}>
        <div className="toolbar" style={{ marginBottom: 0 }}>
          <div>
            <h3 style={{ margin: 0 }}>Past Faceoffs (Public View)</h3>
            <p style={{ color: 'var(--muted)', fontWeight: 600, fontSize: '.85rem', margin: '4px 0 0' }}>
              Lets anyone on the public TV/phone view browse completed face-offs and search player match history.
              Off by default - nothing appears publicly until you turn this on.
            </p>
          </div>
          <button className={`btn ${pastFaceoffs ? 'secondary' : ''}`} onClick={togglePastFaceoffs} disabled={togglingPast}>
            {togglingPast ? 'Switching…' : (pastFaceoffs ? 'Visible - Hide It' : 'Make Visible')}
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3>Getting Started</h3>
        <p style={{ color: 'var(--muted)', fontWeight: 600, lineHeight: 1.7 }}>
          1. Add all 6 teams and their 12 players each under <b>Teams &amp; Players</b>.<br/>
          2. Generate the round-robin schedule under <b>Schedule</b>.<br/>
          3. Before each face-off is played, enter both teams' lineups under <b>Lineups</b>.<br/>
          4. Referees score matches from the separate Referee Scoring App - results appear here automatically.<br/>
          5. Once all 15 face-offs are complete, generate the knockout stage under <b>Knockout Stage</b>.<br/>
          6. Export completed results to DUPR any time under <b>Export to DUPR</b>.
        </p>
      </div>
    </div>
  )
}
