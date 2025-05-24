function searchTables() {
  const input = document.getElementById('searchInput');
  const filter = input.value.toLowerCase();
  const table = document.getElementById('searchTable');
  const tr = table.getElementsByTagName('tr');

  for (let i = 1; i < tr.length; i++) {
      let td = tr[i].getElementsByTagName('td');
      let found = false;
      
      for (let j = 0; j < td.length; j++) {
          if (td[j].innerText.toLowerCase().includes(filter)) {
              found = true;
              break;
          }
      }
      
      if (found) {
          tr[i].style.display = "";
      } else {
          tr[i].style.display = "none";
      }
  }
}

function loadSidebar() {
  fetch('sidebar.html')
     .then(response => response.text())
     .then(data => {
      document.getElementById('sidebar-container').innerHTML = data;
     });
}

function toggleSidebar() {
  var sidebar = document.getElementById("mySidebar");
  var main = document.getElementById("home");

  if (sidebar.style.width === "250px") {
      sidebar.style.width = "0";
      main.style.marginLeft = "0";
  } else {
      sidebar.style.width ="250px";
      main.style.marginLeft = "250px";
  }
}

function loadFooter() {
  fetch('footer.html')
     .then(response => response.text())
     .then(data => {
      document.getElementById('footer-container').innerHTML = data;
     });
}

function addLoadEvent(func) { 
  var oldonload = window.onload; 
  if (typeof window.onload != 'function') { 
    window.onload = func; 
  } else { 
    window.onload = function() { 
      if (oldonload) { 
        oldonload(); 
      } 
      func(); 
    } 
  } 
}


addLoadEvent(function() {
  loadSidebar();
  loadFooter();
  searchTables();  
});
