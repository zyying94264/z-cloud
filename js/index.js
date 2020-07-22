(function () {
  var nowId = 0; //当前选中的文件夹
  var topId = 0; // 顶层id
  var topPid = -1; // 顶层pid

  /* 视图渲染 */
  var treeMenu = document.getElementById("tree-menu");
  // 渲染 侧边栏 无限级菜单
  treeMenu.innerHTML = createTreeMenu(topPid, 0);
  // 无限级菜单渲染
  function createTreeMenu (pid, level, open) {
    // level 当前处在第几级，我们需要根据它的层级给一个缩进
    // 这里注意 移动到弹窗 每一项都需要展开而侧边栏导航只有 nowId 当前选中这项或这项的所有父级才需要展开,如果传入了 open 我们就认为是移动到弹窗的
    var nowData = getChild(pid);//获取到当前组的内容
    var inner = "<ul>";//inner 用来存放我们的内容
    for (var i = 0; i < nowData.length; i++) {
      var hasChild = getChild(nowData[i].id).length > 0 //获取当前项是否有子项
      inner += '<li class="' + (isOpen(nowData[i].id, open) ? "open" : "") + '">';
      inner += `<p 
                  data-id="${nowData[i].id}"
                  class="${hasChild ? 'has-child' : ''} active"
                  style="padding-left: ${(level * 20 + 40)}px;">
                  <span>${nowData[i].title}</span>
                </p>`
      if (hasChild) {//如果当前项有子项，就在这里再生成一个子级的ul
        inner += createTreeMenu(nowData[i].id, level + 1, open);
      }
      inner += '</li>';
    }
    inner += "</ul>";
    return inner;
  }
  // 渲染路径导航
  var breadNav = document.querySelector(".bread-nav");
  breadNav.innerHTML = createBreadNav();
  function createBreadNav () {
    var inner = "";
    var self = getSelf(nowId);
    var allParent = getAllParent(self.pid);
    for (var i = 0; i < allParent.length; i++) {
      inner += `<a data-id="${allParent[i].id}">${allParent[i].title} </a>`
    }
    inner += '<span>' + self.title + '</span>';
    return inner;
  }
  //渲染文件夹区域
  var folders = document.getElementById("folders");
  var checkedAll = document.getElementById("checked-all");
  folders.innerHTML = createFolders();
  function createFolders () {
    var child = getChild(nowId);
    var inner = "";
    if (child.length == 0) {
      folders.classList.add("folders-empty");
      checkedAll.checked = false;
      return "";
    }
    folders.classList.remove("folders-empty");
    checkedAll.checked = isCheckedAll();
    for (var i = 0; i < child.length; i++) {
      inner += '<li class="folder-item ' + (child[i].checked ? "active" : "") + '" data-id="' + child[i].id + '">';
      inner += '<img src="img/folder-b.png" alt="">';
      inner += '<span class="folder-name">' + child[i].title + '</span>';
      inner += '<input type="text" class="editor" value="">';
      inner += '<label class="checked">';
      inner += '<input type="checkbox" ' + (child[i].checked ? "checked" : "") + ' />';
      inner += '<span class="iconfont icon-checkbox-checked"></span>';
      inner += '</label>';
      inner += '</li>';
    }
    return inner;
  }

  /* 三大视图点击切换 */
  // 左侧菜单点击切换
  treeMenu.onclick = function (e) {
    var item;
    switch (e.target.tagName) {
      case "P":
        item = e.target;
        break;
      case "SPAN":
        item = e.target.parentNode;
        break;
    }
    if (item) {
      nowId = item.dataset.id;
      treeMenu.innerHTML = createTreeMenu(topPid, 0);
      breadNav.innerHTML = createBreadNav();
      folders.innerHTML = createFolders();
    }
  };
  //路径导航点击事件添加
  breadNav.onclick = function (e) {
    if (e.target.tagName == "A") {
      nowId = e.target.dataset.id;
      treeMenu.innerHTML = createTreeMenu(topPid, 0);
      breadNav.innerHTML = createBreadNav();
      folders.innerHTML = createFolders();
    }
  };
  //文件夹视图点击切换
  folders.onclick = function (e) {
    var item;
    switch (e.target.tagName) {
      case "LI":
        item = e.target;
        break;
      case "IMG":
        item = e.target.parentNode;
        break;
    }
    if (item) {
      nowId = item.dataset.id;
      treeMenu.innerHTML = createTreeMenu(topPid, 0);
      breadNav.innerHTML = createBreadNav();
      folders.innerHTML = createFolders();
    } else if (e.target.className == "folder-name") { //文件夹重命名
      item = e.target.parentNode;
      rename(item);
    }
  };


  /* 数据操作 */
  // 获取自己
  function getSelf (id) {
    for (var i = 0; i < data.length; i++) {
      if (data[i].id == id) return data[i]
    }
  }
  // 获取子级
  function getChild (id) {
    var child = [];
    for (var i = 0; i < data.length; i++) {
      if (data[i].pid == id) child.push(data[i])
    }
    return child
  }
  // 获取所有子级
  function getAllChild (pid) {
    var child = getChild(pid);
    for (var i = 0; i < child.length; i++) {
      if (getChild(child[i].id).length > 0) {
        child = child.concat(getChild(child[i].id));
      }
    }
    return child;
  }
  // 获取父级
  function getParent (pid) {
    for (var i = 0; i < data.length; i++) {
      if (data[i].id == pid) return data[i]
    }
  }
  // 获取所有父级
  function getAllParent (pid) {
    var allParent = [];
    while (pid > -1) {
      var parent = getParent(pid);
      pid = parent.pid;
      allParent.unshift(parent);
    }
    return allParent;
  }
  // 添加子级
  function add (pid) {
    var newData = {
      id: Date.now(),
      title: getNewName(pid),
      pid: pid
    };
    data.push(newData);
  }
  // 获取一个新的文件夹名字
  function getNewName (pid) {
    var nowDatas = getChild(pid);
    var names = [];
    for (var i = 0; i < nowDatas.length; i++) {
      var title = nowDatas[i].title;
      if (
        (title.substr(0, 6) === "新建文件夹("
          && Number(title.substring(6, title.length - 1)) >= 2
          && title[title.length - 1] === ")")
        || title == "新建文件夹") {
        names.push(title);
      }
    }
    names.sort(function (n1, n2) {
      n1 = n1 == "新建文件夹" ? 0 : Number(n1.substring(6, title.length - 1));
      n2 = n2 == "新建文件夹" ? 0 : Number(n2.substring(6, title.length - 1));
      return n1 - n2;
    });
    if (names[0] !== "新建文件夹") {
      return "新建文件夹"
    }
    for (var i = 1; i < names.length; i++) {
      if (names[i] != "新建文件夹(" + (i + 1) + ")") {
        return "新建文件夹(" + (i + 1) + ")";
      }
    }
    return "新建文件夹(" + (i + 1) + ")";
  }
  //获取当前这项是否需要展开
  function isOpen (id, open) {
    // id 当前数据项id , open 是否传入open状态
    if (open) return true; //如果传入了open状态代表目前我们需要open
    // 如果没有 open 状态，判断当前项 是否是 nowId 或者 他的父级
    if (id == nowId) return true;
    var nowAllParent = getAllParent(nowId);
    for (var i = 0; i < nowAllParent.length; i++) {
      if (id == nowAllParent[i].id) return true;
    }
    return false;
  }
  // 判断当前是否全选
  function isCheckedAll () {
    var child = getChild(nowId);
    for (var i = 0; i < child.length; i++) {
      if (!child[i].checked) return false;
    }
    return true;
  }
  // 删除子级
  function removeData (id) {
    var self = getSelf(id);
    var removeItem = getAllChild(id).concat(self);
    for (var i = 0; i < removeItem.length; i++) {
      var index = data.indexOf(removeItem[i]);
      data.splice(index, 1);
    }
  }

  /* 新建文件夹 */
  var createBtn = document.querySelector(".create-btn");
  createBtn.onclick = function () {
    add(nowId);
    treeMenu.innerHTML = createTreeMenu(topPid, 0);
    folders.innerHTML = createFolders();
    successPopup("添加文件成功");
  };

  /* 各种弹窗 */

  // 操作成功提示
  var alertSuccess = document.querySelector(".alert-success");
  var successTimer = 0;
  function successPopup (info) {
    // info 需要提示的信息
    alertSuccess.innerHTML = info;
    alertSuccess.classList.add("alert-show");
    clearTimeout(successTimer);
    successTimer = setTimeout(function () {
      alertSuccess.classList.remove("alert-show");
    }, 2000);
  }

  /* 右键菜单 */
  var contextmenu = document.querySelector("#contextmenu");
  var contextmenuBtn = contextmenu.children;
  document.oncontextmenu = function () {
    contextmenu.style.display = "none";
    return false;
  };
  // 文件夹右键菜单
  var active_id = 0;
  folders.oncontextmenu = function (e) {
    var item;
    switch (e.target.tagName) {
      case "LI":
        item = e.target;
        break;
      case "IMG":
        item = e.target.parentNode;
        break;
    }
    if (item) {
      active_id = item.dataset.id;
      contextmenu.style.left = e.clientX + "px";
      contextmenu.style.top = e.clientY + "px";
      contextmenu.style.display = "block";
      e.cancelBubble = true;
      return false;
    }
  };
  document.onmousedown = function () {
    contextmenu.style.display = "none";
  };
  contextmenu.onmousedown = function (e) {
    e.cancelBubble = true;
  };
  // 删除当前文件夹
  contextmenuBtn[0].onclick = function () {
    showConfirm("确定删除当前文件夹吗?", function () {
      removeData(active_id);
      treeMenu.innerHTML = createTreeMenu(topPid, 0);
      folders.innerHTML = createFolders();
      successPopup("删除文件夹成功");
    });
    contextmenu.style.display = "none";
  };


  /* confirm 弹窗 */
  var elConfirm = document.querySelector(".confirm");
  var confirmClos = elConfirm.querySelector(".clos");
  var confirmTxt = elConfirm.querySelector(".confirm-text");
  var confirmBtns = elConfirm.querySelectorAll(".confirm-btns a");
  var mask = document.getElementById("mask");
  function showConfirm (txt, cb) {
    mask.style.display = "block";
    elConfirm.classList.add("confirm-show");
    confirmTxt.innerHTML = txt;
    confirmBtns[0].onclick = confirmClos.onclick = function () {
      elConfirm.classList.remove("confirm-show");
      mask.style.display = "none";
      cb && cb();
    };
  }
  confirmBtns[1].onclick = confirmClos.onclick = function () {
    elConfirm.classList.remove("confirm-show");
    mask.style.display = "none";
  };






})()
