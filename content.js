$(function () {
  let updateTimer, //debounced timer on changes
    lockUpdates = false


  function initialize() {
    const logoUrl = chrome.runtime.getURL('images/rprss128.png')
    $('.feeder-logo').css({
      backgroundImage: `url(${logoUrl})`,
      backgroundSize: 'contain',
      height: '60px',
      color: 'white',
      'text-align': 'center',
      'background-position': 'left',
      'line-height': '60px',
      'text-indent': '15px',
    })
      .text('RavenPack Feed')

    $('.MoreFeatures').remove()
  }

  function updatePosts() {
    console.log('Updating posts ****')
    lockUpdates = true
    $('#post-upgrade_post').remove()
    let $listContainer = $('.tpl-post-list')
    $listContainer.css('background', 'red')
    $listContainer.find('.item').each((_, item) => {
      const $item = $(item),
        $title = $item.find('.item-title--text'),
        text = $title.text()
      // strip the initial RE: from the text
      if (text.startsWith('RE: ')) $title.text(text.substr(4))
    })

    const sortingFunction = (a, b) => {
      const titleA = $(a).find('.item-title--text').text(),
        titleB = $(b).find('.item-title--text').text()
      return titleA < titleB ? -1 : 1
    }
    const children = $listContainer.find('.list-item').get() // array of children
    children.sort(sortingFunction)
    $listContainer.append(children)
    setTimeout(() => { // unlock updates from text tick
      lockUpdates = false
    }, 0)
  }

  function watchChanges() {
    const
      MutationObserver = window.MutationObserver || window.WebKitMutationObserver,
      rootNode = $('.post-list-container').get(0),
      config = {
        attributes: true,
        childList: true,
        subtree: true,
      },
      callback = function (mutationsList, observer) {
        if (lockUpdates) return
        mutationsList.forEach(mutation => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
              const nodeClasses = node.classList
              if (nodeClasses &&
                (nodeClasses.contains('list-item')
                  || nodeClasses.contains('tpl-post-list'))) {
                clearTimeout(updateTimer)
                updateTimer = setTimeout(updatePosts, 300)
              }
            })
            // console.log('A child node has been added or removed.', mutation)
          } else if (mutation.type === 'attributes') {
            // console.log('The ' + mutation.attributeName + ' attribute was modified.')
          }
        })
      },
      observer = new MutationObserver(callback)

    observer.observe(rootNode, config)
  }


  initialize()
  watchChanges()
})
