(function(){
  var STORAGE_KEY = 'case-ledger-entries-v1';
  var entries = [];

  try{
    var raw = localStorage.getItem(STORAGE_KEY);
    if(raw) entries = JSON.parse(raw);
  }catch(e){ entries = []; }

  function save(){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); }
    catch(e){ /* storage unavailable; continue in-memory */ }
  }

  var TYPE_CODE = {
    chat:'CHAT', screenshot:'SHOT', transaction:'TXN', email:'MAIL', url:'LINK', phone:'PH#', call:'CALL'
  };
  var TYPE_LABEL = {
    chat:'Chat message', screenshot:'Screenshot', transaction:'Transaction', email:'Email', url:'Link', phone:'Phone number', call:'Call log'
  };

  function uid(){ return 'e' + Math.random().toString(36).slice(2,10); }

  function parseAmount(v){
    if(!v) return null;
    var n = parseFloat(String(v).replace(/[^0-9.\-]/g,''));
    return isNaN(n) ? null : n;
  }

  function computeFlags(list){
    // group by amount+ref for duplicate detection
    var groups = {};
    list.forEach(function(e){
      var amt = parseAmount(e.amount);
      if(e.reference && amt !== null){
        var key = e.reference.trim().toLowerCase() + '|' + amt;
        groups[key] = groups[key] || [];
        groups[key].push(e.id);
      }
    });
    var dupIds = {};
    Object.keys(groups).forEach(function(k){
      if(groups[k].length > 1) groups[k].forEach(function(id){ dupIds[id] = true; });
    });

    return list.map(function(e){
      var flags = [];
      if(!e.date) flags.push('Missing date');
      if(e.type === 'transaction' && parseAmount(e.amount) === null) flags.push('Missing amount');
      if(e.type === 'transaction' && !e.reference) flags.push('Missing reference');
      if(dupIds[e.id]) flags.push('Possible duplicate');
      return Object.assign({}, e, { flags: flags });
    });
  }

  function fmtDateHeading(dateStr){
    if(!dateStr) return 'Undated';
    var d = new Date(dateStr + 'T00:00:00');
    if(isNaN(d)) return dateStr;
    return d.toLocaleDateString(undefined, { weekday:'short', year:'numeric', month:'short', day:'numeric' });
  }

  function maskPhone(v){
    var digits = v.replace(/\D/g,'');
    if(digits.length <= 4) return '••••';
    return digits.slice(0,2) + '•'.repeat(Math.max(digits.length-4,2)) + digits.slice(-2);
  }
  function maskEmail(v){
    var parts = v.split('@');
    if(parts.length !== 2) return maskGeneric(v);
    return parts[0].slice(0,1) + '•••@' + parts[1];
  }
  function maskUrl(v){
    try{
      var u = new URL(v.match(/^https?:\/\//) ? v : 'https://' + v);
      return u.hostname + '/•••';
    }catch(e){ return maskGeneric(v); }
  }
  function maskRef(v){
    if(v.length <= 4) return '•'.repeat(v.length);
    return '•'.repeat(v.length-4) + v.slice(-4);
  }
  function maskGeneric(v){
    if(v.length <= 3) return '•'.repeat(v.length);
    return v.slice(0,1) + '•'.repeat(v.length-2) + v.slice(-1);
  }
  function maskContact(v){
    if(!v) return v;
    if(v.includes('@')) return maskEmail(v);
    if(/https?:\/\/|www\./i.test(v) || /\.[a-z]{2,}(\/|$)/i.test(v)) return maskUrl(v);
    if(/\d{5,}/.test(v)) return maskPhone(v);
    return maskGeneric(v);
  }

  function render(){
    var flagged = computeFlags(entries);
    renderStats(flagged);
    renderTimeline(flagged);
  }

  function renderStats(list){
    var el = document.getElementById('stats');
    var withDate = list.filter(function(e){ return e.date; }).map(function(e){ return e.date; }).sort();
    var range = withDate.length ? (fmtShort(withDate[0]) + ' – ' + fmtShort(withDate[withDate.length-1])) : '—';
    var total = list.reduce(function(sum,e){ var a = parseAmount(e.amount); return sum + (a || 0); }, 0);
    var flaggedCount = list.filter(function(e){ return e.flags.length; }).length;

    el.innerHTML =
      stat(list.length, 'Entries logged') +
      stat(range, 'Date range') +
      stat(total ? ('₹' + total.toLocaleString()) : '—', 'Amount referenced') +
      stat(flaggedCount, 'Flagged for review', flaggedCount > 0);
  }
  function fmtShort(d){
    var dt = new Date(d + 'T00:00:00');
    return isNaN(dt) ? d : dt.toLocaleDateString(undefined,{month:'short', day:'numeric'});
  }
  function stat(n, l, isFlag){
    return '<div class="stat' + (isFlag ? ' is-flagged' : '') + '"><div class="n">' + escapeHtml(String(n)) + '</div><div class="l">' + l + '</div></div>';
  }

  function renderTimeline(list){
    var card = document.getElementById('timelineCard');
    var hint = document.getElementById('timelineHint');
    if(!list.length){
      hint.textContent = '';
      card.innerHTML = '<div class="empty"><h3>No evidence yet</h3><p>Add your first entry above, or load example evidence to see how the ledger organizes it.</p></div>';
      return;
    }
    hint.textContent = list.length + ' item' + (list.length===1?'':'s') + ', oldest first';

    var sorted = list.slice().sort(function(a,b){
      var ak = (a.date||'9999') + 'T' + (a.time||'00:00');
      var bk = (b.date||'9999') + 'T' + (b.time||'00:00');
      return ak < bk ? -1 : ak > bk ? 1 : 0;
    });

    var byDay = {};
    var order = [];
    sorted.forEach(function(e){
      var key = e.date || '__undated__';
      if(!byDay[key]){ byDay[key] = []; order.push(key); }
      byDay[key].push(e);
    });

    var html = '';
    order.forEach(function(key){
      html += '<div class="day-label">' + (key === '__undated__' ? 'UNDATED' : fmtDateHeading(key).toUpperCase()) + '</div>';
      byDay[key].forEach(function(e){
        html += renderRow(e);
      });
    });
    card.innerHTML = html;

    card.querySelectorAll('[data-del]').forEach(function(btn){
      btn.addEventListener('click', function(){
        entries = entries.filter(function(e){ return e.id !== btn.getAttribute('data-del'); });
        save(); render();
      });
    });
  }

  function renderRow(e){
    var metaBits = [];
    if(e.amount) metaBits.push('<span>Amount <b>' + escapeHtml(e.amount) + '</b></span>');
    if(e.reference) metaBits.push('<span>Ref <b>' + escapeHtml(e.reference) + '</b></span>');
    if(e.contact) metaBits.push('<span>Contact <b>' + escapeHtml(e.contact) + '</b></span>');
    if(e.source) metaBits.push('<span>Source <b>' + escapeHtml(e.source) + '</b></span>');

    var flagsHtml = e.flags.length ? '<div class="flags">' + e.flags.map(function(f){
      return '<span class="flag-badge">' + f + '</span>';
    }).join('') + '</div>' : '';

    return '<div class="entry-row' + (e.flags.length ? ' has-flag' : '') + '">' +
      '<div class="entry-time">' + (e.time || '—') + '</div>' +
      '<div class="entry-code">' + TYPE_CODE[e.type] + '</div>' +
      '<div class="entry-body">' +
        '<p>' + (e.description ? escapeHtml(e.description) : '<em style="color:var(--ink-faint)">No description added</em>') + '</p>' +
        (metaBits.length ? '<div class="entry-meta">' + metaBits.join('') + '</div>' : '') +
        flagsHtml +
      '</div>' +
      '<div class="row-actions"><button class="btn-danger-text" data-del="' + e.id + '">Remove</button></div>' +
    '</div>';
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  // form handling
  document.getElementById('entryForm').addEventListener('submit', function(ev){
    ev.preventDefault();
    var e = {
      id: uid(),
      type: document.getElementById('f-type').value,
      date: document.getElementById('f-date').value,
      time: document.getElementById('f-time').value,
      description: document.getElementById('f-desc').value.trim(),
      amount: document.getElementById('f-amount').value.trim(),
      reference: document.getElementById('f-ref').value.trim(),
      contact: document.getElementById('f-contact').value.trim(),
      source: document.getElementById('f-source').value.trim()
    };
    entries.push(e);
    save(); render();
    document.getElementById('entryForm').reset();
    document.getElementById('f-desc').focus();
  });

  document.getElementById('clearFormBtn').addEventListener('click', function(){
    document.getElementById('entryForm').reset();
  });

  document.getElementById('sampleBtn').addEventListener('click', function(){
    var sample = [
      { type:'call', date:'2026-09-10', time:'11:02', description:'Caller claimed to be from the bank\'s "fraud prevention team", said the account was compromised.', amount:'', reference:'', contact:'+91 98•••••210', source:'Personal phone, incoming call' },
      { type:'phone', date:'2026-09-10', time:'11:02', description:'Number the caller used, later found unregistered with the bank.', amount:'', reference:'', contact:'+91 9876543210', source:'Call log' },
      { type:'chat', date:'2026-09-10', time:'11:14', description:'"Sent" a link to "verify" the account and asked to enter card details.', amount:'', reference:'', contact:'verify-secure-bank.example', source:'SMS thread' },
      { type:'url', date:'2026-09-10', time:'11:15', description:'Lookalike login page asking for card number, expiry and OTP.', amount:'', reference:'', contact:'verify-secure-bank.example/login', source:'Browser history' },
      { type:'transaction', date:'2026-09-10', time:'11:18', description:'Unauthorized debit shortly after entering details on the site.', amount:'24,500', reference:'UTR2026091087234', contact:'', source:'Bank SMS alert' },
      { type:'screenshot', date:'2026-09-10', time:'11:19', description:'Screenshot of the debit SMS from the bank.', amount:'24,500', reference:'UTR2026091087234', contact:'', source:'Phone gallery' },
      { type:'email', date:'2026-09-11', time:'09:40', description:'Follow-up email asking for a "processing fee" to reverse the transaction.', amount:'', reference:'', contact:'refunds@example-support.com', source:'Gmail' },
      { type:'transaction', date:'2026-09-10', time:'11:18', description:'Duplicate note of the same debit, logged separately from the bank alert.', amount:'24,500', reference:'UTR2026091087234', contact:'', source:'Bank statement' }
    ];
    sample.forEach(function(s){ s.id = uid(); entries.push(s); });
    save(); render();
  });

  // report
  function buildReport(mask){
    var flagged = computeFlags(entries);
    var sorted = flagged.slice().sort(function(a,b){
      var ak = (a.date||'9999') + 'T' + (a.time||'00:00');
      var bk = (b.date||'9999') + 'T' + (b.time||'00:00');
      return ak < bk ? -1 : ak > bk ? 1 : 0;
    });
    var withDate = sorted.filter(function(e){ return e.date; });
    var range = withDate.length ? (withDate[0].date + ' to ' + withDate[withDate.length-1].date) : 'unknown';
    var total = sorted.reduce(function(sum,e){ var a = parseAmount(e.amount); return sum + (a||0); }, 0);
    var issues = sorted.filter(function(e){ return e.flags.length; });

    var lines = [];
    lines.push('INCIDENT EVIDENCE REPORT');
    lines.push('Generated ' + new Date().toLocaleString());
    lines.push('');
    lines.push('Entries: ' + sorted.length + '   Date range: ' + range + '   Amount referenced: ' + (total ? total.toLocaleString() : 'n/a') + '   Flagged: ' + issues.length);
    lines.push('');
    lines.push('This is a compiled record of evidence as entered. It does not determine fault and is not a substitute for filing an official report.');
    lines.push('');
    lines.push('-----------------------------------------------');
    lines.push('CHRONOLOGICAL TIMELINE');
    lines.push('-----------------------------------------------');
    sorted.forEach(function(e){
      var contact = e.contact ? (mask ? maskContact(e.contact) : e.contact) : '';
      var ref = e.reference ? (mask ? maskRef(e.reference) : e.reference) : '';
      var bits = [];
      if(e.amount) bits.push('amount ' + e.amount);
      if(ref) bits.push('ref ' + ref);
      if(contact) bits.push('contact ' + contact);
      if(e.source) bits.push('source ' + e.source);
      lines.push((e.date || 'undated') + ' ' + (e.time||'--:--') + '  [' + TYPE_LABEL[e.type] + ']');
      lines.push('  ' + (e.description || '(no description)'));
      if(bits.length) lines.push('  ' + bits.join(' · '));
      if(e.flags.length) lines.push('  FLAG: ' + e.flags.join(', '));
      lines.push('');
    });
    lines.push('-----------------------------------------------');
    lines.push('ISSUES TO REVIEW');
    lines.push('-----------------------------------------------');
    if(!issues.length){
      lines.push('No missing dates, references, or likely duplicates detected.');
    } else {
      issues.forEach(function(e){
        lines.push('- ' + (e.date||'undated') + ' ' + (e.time||'') + ' [' + TYPE_LABEL[e.type] + ']: ' + e.flags.join(', '));
      });
    }
    lines.push('');
    lines.push('-----------------------------------------------');
    lines.push('REPORTING CHECKLIST');
    lines.push('-----------------------------------------------');
    [
      'Contact your bank or payment provider to flag the transaction(s) above',
      'File a report with your local cybercrime reporting authority',
      'File a police report if your bank or authority directs you to',
      'Change passwords on any account mentioned above, and enable two-factor authentication',
      'Keep original evidence (screenshots, SMS, emails) unedited and backed up',
      'Share this report only with your bank, official investigators, or someone you trust'
    ].forEach(function(item){ lines.push('[ ] ' + item); });

    return lines.join('\n');
  }

  document.getElementById('genBtn').addEventListener('click', function(){
    var mask = document.getElementById('maskToggle').checked;
    document.getElementById('reportOut').textContent = entries.length ? buildReport(mask) : 'Add at least one entry to generate a report.';
    document.getElementById('copiedMsg').style.display = 'none';
  });

  document.getElementById('copyBtn').addEventListener('click', function(){
    var text = document.getElementById('reportOut').textContent;
    var msg = document.getElementById('copiedMsg');
    function shown(){ msg.style.display='inline'; setTimeout(function(){ msg.style.display='none'; }, 2000); }
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(shown).catch(function(){
        fallbackCopy(text); shown();
      });
    } else {
      fallbackCopy(text); shown();
    }
  });
  function fallbackCopy(text){
    var ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    try{ document.execCommand('copy'); }catch(e){}
    document.body.removeChild(ta);
  }

  document.getElementById('printBtn').addEventListener('click', function(){
    var mask = document.getElementById('maskToggle').checked;
    document.getElementById('reportOut').textContent = entries.length ? buildReport(mask) : 'Add at least one entry to generate a report.';
    window.print();
  });

  render();
})();