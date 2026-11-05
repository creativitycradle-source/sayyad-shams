// Progress shared by every page of the site (same origin => same storage).
// path-done: [unit numbers the child marked finished]; path-visited: [unit numbers opened];
// passport-stamps: {unit index (0-based): date} written by the passport quiz.
(function () {
  const S = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  const P = {
    done() { return new Set(S.get('path-done', [])); },
    visited() { return new Set(S.get('path-visited', [])); },
    stamps() { return S.get('passport-stamps', {}); },
    name() { return (S.get('passport-name', '') || '').trim(); },
    status(n) {
      if (P.stamps()[n - 1]) return 'stamped';
      if (P.done().has(n)) return 'done';
      if (P.visited().has(n)) return 'visited';
      return 'new';
    },
    finished(n) { const s = P.status(n); return s === 'stamped' || s === 'done'; },
    count() { let c = 0; for (let n = 1; n <= 8; n++) if (P.finished(n)) c++; return c; },
    next() { for (let n = 1; n <= 8; n++) if (!P.finished(n)) return n; return 0; },
    visit(n) { const v = P.visited(); v.add(n); S.set('path-visited', [...v]); },
    setDone(n, on) { const d = P.done(); on ? d.add(n) : d.delete(n); S.set('path-done', [...d]); },
    // progress code: SH-XXXX-C  (XXXX = 16 bits: low byte = done, high byte = stamps; C = checksum)
    code() {
      let done = 0, st = 0; const s = P.stamps(), d = P.done();
      for (let n = 1; n <= 8; n++) { if (d.has(n)) done |= 1 << (n - 1); if (s[n - 1]) st |= 1 << (n - 1); }
      const v = (st << 8) | done, hex = v.toString(16).toUpperCase().padStart(4, '0');
      return 'SH-' + hex + '-' + P.sum(hex);
    },
    sum(hex) { let c = 7; for (const ch of hex) c = (c * 31 + ch.charCodeAt(0)) % 36; return c.toString(36).toUpperCase(); },
    restore(txt) {
      const m = String(txt).toUpperCase().replace(/\s+/g, '').match(/^SH-?([0-9A-F]{4})-?([0-9A-Z])$/);
      if (!m || P.sum(m[1]) !== m[2]) return false;
      const v = parseInt(m[1], 16), done = [], st = P.stamps();
      for (let n = 1; n <= 8; n++) { if (v & (1 << (n - 1))) done.push(n); if (v & (1 << (n + 7))) { if (!st[n - 1]) st[n - 1] = 'مستعاد'; } else delete st[n - 1]; }
      S.set('path-done', done); S.set('passport-stamps', st);
      const vis = P.visited(); done.forEach(n => vis.add(n)); S.set('path-visited', [...vis]);
      return true;
    },
    reset() { ['path-done', 'path-visited', 'passport-stamps'].forEach(S.del); },
    label: { stamped: 'مختومة', done: 'أنجزتها', visited: 'بدأتها', new: 'لم تبدأ', next: 'التالية' }
  };
  window.SH = P;
})();
