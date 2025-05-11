// 1) Load CSV
Papa.parse('chronicabsenteeism.csv', {
    download: true,
    header: true,
    complete: ({ data }) => initDashboard(data)
  });
  
  function initDashboard(rows) {
    const allYears = [2020, 2021, 2022, 2023, 2024];
  
    // 2) Build schoolList
    const schoolList = rows
      .filter(r => r['School ID'])
      .map(r => {
        const vals = allYears.map(y => parseFloat(r[`${y} CA`]) || 0);
        return {
          id:       r['School ID'],
          name:     r['School Name'],
          years:    allYears,
          caValues: vals,
          // max of 2020–2023 minus 2024
          dropPts:  Math.max(...vals.slice(0,4)) - vals[4]
        };
      });
  
    // 3) Show improved ≥30 points
    const improved = schoolList.filter(s => s.dropPts >= 30);
    const ul = document.getElementById('improvedList');
    improved.forEach(s => {
      const li = document.createElement('li');
      li.textContent = `${s.name} (–${s.dropPts.toFixed(1)} pts)`;
      ul.appendChild(li);
    });
  
    // 4) Pagination (12 charts/page)
    const perPage = 12;
    let currentPage = 1;
    const totalPages = Math.ceil(schoolList.length / perPage);
  
    const chartsContainer = document.getElementById('charts');
    const pageInfo        = document.getElementById('pageInfo');
    const btnPrev         = document.getElementById('prev');
    const btnNext         = document.getElementById('next');
  
    function renderPage() {
      chartsContainer.innerHTML = '';
      const slice = schoolList.slice(
        (currentPage-1)*perPage,
        currentPage*perPage
      );
  
      slice.forEach(school => {
        const card = document.createElement('div');
        card.className = 'chart-card';
        card.innerHTML = `<h4>${school.name}</h4><canvas></canvas>`;
        chartsContainer.append(card);
  
        const maxVal = Math.max(...school.caValues);
        const yMax = maxVal <= 60 ? 60 : 100;
  
        new Chart(card.querySelector('canvas').getContext('2d'), {
          type: 'line',
          data: {
            labels: school.years,
            datasets: [{
              label: '% Chronic Absenteeism',
              data:  school.caValues,
              fill:  false,
              borderWidth: 2,
              tension: 0.3
            }]
          },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              y: { min: 0, max: yMax, ticks: { callback: v => v + '%' } },
              x: { title: { display: true, text: 'Year' } }
            }
          }
        });
      });
  
      pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
      btnPrev.disabled = currentPage === 1;
      btnNext.disabled = currentPage === totalPages;
    }
  
    btnPrev.onclick = () => { if (currentPage>1) { currentPage--; renderPage(); } };
    btnNext.onclick = () => { if (currentPage<totalPages) { currentPage++; renderPage(); } };
  
    renderPage();
  
    // 5) Compare up to 5 schools
    const select = document.getElementById('compareSelect');
    // Populate options alphabetically
    schoolList
      .sort((a,b) => a.name.localeCompare(b.name))
      .forEach(s => {
        const opt = new Option(s.name, s.id);
        select.add(opt);
      });
  
    // Initialize Choices.js
    const choices = new Choices(select, {
      removeItemButton: true,
      maxItemCount: 5,
      searchEnabled: true,
      placeholderValue: 'Select up to 5 schools'
    });
  
    let compareChart = null;
    function updateCompare() {
      const selectedIds = choices.getValue(true); // array of values
      const datasets = selectedIds.map((id, i) => {
        const s = schoolList.find(x => x.id === id);
        return {
          label: s.name,
          data:  s.caValues,
          fill:  false,
          borderWidth: 2,
          tension: 0.3
          // Chart.js will auto-assign distinct colors for you
        };
      });
  
      const ctx = document.getElementById('compareChart').getContext('2d');
      if (compareChart) compareChart.destroy();
      compareChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: allYears,
          datasets
        },
        options: {
          responsive: true,
          scales: {
            y: { min:0, max:100, ticks:{ callback: v => v + '%' } },
            x: { title: { display: true, text: 'Year' } }
          }
        }
      });
    }
  
    // Re-draw every time selection changes
    select.addEventListener('change', updateCompare);
    // Initial empty chart
    updateCompare();
  }
  