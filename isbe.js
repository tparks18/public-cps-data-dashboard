// Make sure this matches your actual file name exactly:
Papa.parse('Five-Essentials_Combined_Long.csv', {
    download: true,
    header: true,
    complete: ({ data }) => initDashboard(data)
  });
  
  function initDashboard(rows) {
    console.log('parsed rows:', rows.length);
    const chartsContainer = document.getElementById('charts');
    if (!rows.length) {
      chartsContainer.classList.add('no-data');
      chartsContainer.textContent = '⚠️ No rows found. Check that the CSV name and headers match exactly.';
      return;
    }
  
    // 1) Group by RCDTS
    const schools = {};
    rows.forEach(r => {
      const id = r['RCDTS'];
      if (!id) return;
      if (!schools[id]) {
        schools[id] = { name: r['School Name'], entries: [] };
      }
      schools[id].entries.push({
        year:                      +r['Year'],
        ambitious:           parseFloat(r['ambitious_instruction'])       || 0,
        collaborative:       parseFloat(r['collaborative_teachers'])      || 0,
        families:            parseFloat(r['involved_families'])           || 0,
        environment:         parseFloat(r['supportive_environment'])      || 0
      });
    });
  
    // 2) Flatten & sort
    const schoolList = Object.values(schools).map(s => {
      s.entries.sort((a,b) => a.year - b.year);
      return {
        name:         s.name,
        years:        s.entries.map(e => e.year),
        ambitious:    s.entries.map(e => e.ambitious),
        collaborative:s.entries.map(e => e.collaborative),
        families:     s.entries.map(e => e.families),
        environment:  s.entries.map(e => e.environment)
      };
    });
  
    // 3) Pagination setup
    const perPage    = 12;
    let currentPage  = 1;
    const totalPages = Math.ceil(schoolList.length / perPage);
  
    const pageInfo = document.getElementById('pageInfo');
    const btnPrev  = document.getElementById('prev');
    const btnNext  = document.getElementById('next');
  
    function renderPage() {
      chartsContainer.innerHTML = '';
      const slice = schoolList.slice((currentPage-1)*perPage, currentPage*perPage);
  
      slice.forEach(s => {
        const card = document.createElement('div');
        card.className = 'chart-card';
        card.innerHTML = `<h4>${s.name}</h4><canvas></canvas>`;
        chartsContainer.append(card);
  
        const ctx = card.querySelector('canvas').getContext('2d');
        new Chart(ctx, {
          type: 'line',
          data: {
            labels: s.years,
            datasets: [
              { label: 'Ambitious Instruction', data: s.ambitious,    fill:false, borderWidth:2, tension:0.3 },
              { label: 'Collaborative Teachers', data: s.collaborative, fill:false, borderWidth:2, tension:0.3 },
              { label: 'Involved Families',       data: s.families,     fill:false, borderWidth:2, tension:0.3 },
              { label: 'Supportive Environment',  data: s.environment,  fill:false, borderWidth:2, tension:0.3 }
            ]
          },
          options: {
            responsive: true,
            plugins: { legend: { display: true, position: 'bottom', labels:{ boxWidth:12 } } },
            scales: {
              y: { beginAtZero:true, title:{ display:true, text:'Score' } },
              x: { title:{ display:true, text:'Year' } }
            }
          }
        });
      });
  
      pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
      btnPrev.disabled = currentPage === 1;
      btnNext.disabled = currentPage === totalPages;
    }
  
    btnPrev.addEventListener('click', () => {
      if (currentPage > 1) { currentPage--; renderPage(); }
    });
    btnNext.addEventListener('click', () => {
      if (currentPage < totalPages) { currentPage++; renderPage(); }
    });
  
    // initial draw
    renderPage();
  }
  