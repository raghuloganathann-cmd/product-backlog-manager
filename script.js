(function(){
  // In-memory store. Swap this for API calls to a backend/database
  // if you want data to persist between sessions.
  let items = [
    {id: makeId(), title:"Set up project repo", description:"Initialize repo, CI pipeline, and base folder structure.", priority:"medium", points:2, status:"done"},
    {id: makeId(), title:"Design login screen", description:"Wireframe and visual design for the sign-in flow.", priority:"high", points:3, status:"inprogress"},
    {id: makeId(), title:"Add password reset flow", description:"Email-based reset link with expiring token.", priority:"critical", points:5, status:"todo"},
    {id: makeId(), title:"Write onboarding emails", description:"Draft the first three lifecycle emails for new signups.", priority:"low", points:2, status:"backlog"},
    {id: makeId(), title:"Refactor API error handling", description:"Standardize error shapes returned by the backend.", priority:"medium", points:5, status:"backlog"},
  ];

  const listEls = {
    backlog: document.getElementById('list-backlog'),
    todo: document.getElementById('list-todo'),
    inprogress: document.getElementById('list-inprogress'),
    done: document.getElementById('list-done'),
  };
  const countEls = {
    backlog: document.getElementById('count-backlog'),
    todo: document.getElementById('count-todo'),
    inprogress: document.getElementById('count-inprogress'),
    done: document.getElementById('count-done'),
  };

  const overlay = document.getElementById('overlay');
  const form = document.getElementById('itemForm');
  const modalTitle = document.getElementById('modalTitle');
  const searchInput = document.getElementById('searchInput');
  const priorityFilter = document.getElementById('priorityFilter');

  function makeId(){
    return 'id-' + Math.random().toString(36).slice(2, 10);
  }

  function priorityLabel(p){
    return {critical:'Critical', high:'High', medium:'Medium', low:'Low'}[p] || p;
  }
  function priorityClass(p){
    return {critical:'crit', high:'high', medium:'med', low:'low'}[p] || 'low';
  }

  function render(){
    const query = searchInput.value.trim().toLowerCase();
    const pFilter = priorityFilter.value;

    Object.keys(listEls).forEach(status => {
      listEls[status].innerHTML = '';
    });

    const visible = items.filter(it => {
      const matchesQuery = !query || it.title.toLowerCase().includes(query) || it.description.toLowerCase().includes(query);
      const matchesPriority = pFilter === 'all' || it.priority === pFilter;
      return matchesQuery && matchesPriority;
    });

    Object.keys(listEls).forEach(status => {
      const group = visible.filter(it => it.status === status);
      countEls[status].textContent = group.length;
      if(group.length === 0){
        const empty = document.createElement('div');
        empty.className = 'empty-slot';
        empty.textContent = status === 'done' ? 'Nothing finished yet' : 'No cards here';
        listEls[status].appendChild(empty);
      } else {
        group.forEach(it => listEls[status].appendChild(buildCard(it)));
      }
    });
  }

  function buildCard(it){
    const card = document.createElement('article');
    card.className = 'card';
    card.draggable = true;
    card.dataset.id = it.id;
    card.tabIndex = 0;
    card.setAttribute('aria-label', it.title);

    card.innerHTML = `
      <div class="pin"></div>
      <div class="tape ${priorityClass(it.priority)}"></div>
      <div class="card-actions">
        <button type="button" class="edit-btn" title="Edit" aria-label="Edit ${escapeHtml(it.title)}">&#9998;</button>
        <button type="button" class="del-btn" title="Delete" aria-label="Delete ${escapeHtml(it.title)}">&#10005;</button>
      </div>
      <h3>${escapeHtml(it.title)}</h3>
      ${it.description ? `<p>${escapeHtml(it.description)}</p>` : ''}
      <div class="card-meta">
        <span class="priority-label ${priorityClass(it.priority)}">${priorityLabel(it.priority)}</span>
        <span class="points">${it.points} pts</span>
      </div>
    `;

    card.addEventListener('dragstart', () => card.classList.add('dragging'));
    card.addEventListener('dragend', () => card.classList.remove('dragging'));

    card.querySelector('.edit-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      openModal(it);
    });
    card.querySelector('.del-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      items = items.filter(x => x.id !== it.id);
      render();
    });

    return card;
  }

  function escapeHtml(str){
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Drag and drop between columns
  document.querySelectorAll('.column').forEach(col => {
    col.addEventListener('dragover', (e) => {
      e.preventDefault();
      col.classList.add('drag-over');
    });
    col.addEventListener('dragleave', () => col.classList.remove('drag-over'));
    col.addEventListener('drop', (e) => {
      e.preventDefault();
      col.classList.remove('drag-over');
      const dragging = document.querySelector('.card.dragging');
      if(!dragging) return;
      const id = dragging.dataset.id;
      const status = col.dataset.status;
      const it = items.find(x => x.id === id);
      if(it) it.status = status;
      render();
    });
  });

  // Modal handling
  document.getElementById('openAddBtn').addEventListener('click', () => openModal());
  document.getElementById('cancelBtn').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => { if(e.target === overlay) closeModal(); });
  document.addEventListener('keydown', (e) => { if(e.key === 'Escape' && !overlay.hidden) closeModal(); });

  function openModal(item){
    form.reset();
    if(item){
      modalTitle.textContent = 'Edit backlog item';
      document.getElementById('itemId').value = item.id;
      document.getElementById('itemTitle').value = item.title;
      document.getElementById('itemDesc').value = item.description;
      document.getElementById('itemPriority').value = item.priority;
      document.getElementById('itemPoints').value = item.points;
      document.getElementById('itemStatus').value = item.status;
    } else {
      modalTitle.textContent = 'New backlog item';
      document.getElementById('itemId').value = '';
      document.getElementById('itemStatus').value = 'backlog';
    }
    overlay.hidden = false;
    document.getElementById('itemTitle').focus();
  }

  function closeModal(){
    overlay.hidden = true;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('itemId').value;
    const data = {
      title: document.getElementById('itemTitle').value.trim(),
      description: document.getElementById('itemDesc').value.trim(),
      priority: document.getElementById('itemPriority').value,
      points: Number(document.getElementById('itemPoints').value),
      status: document.getElementById('itemStatus').value,
    };
    if(!data.title) return;

    if(id){
      const it = items.find(x => x.id === id);
      Object.assign(it, data);
    } else {
      items.push({id: makeId(), ...data});
    }
    closeModal();
    render();
  });

  searchInput.addEventListener('input', render);
  priorityFilter.addEventListener('change', render);

  render();
})();
