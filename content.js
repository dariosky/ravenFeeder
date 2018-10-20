$(function () {
  let updateTimer //debounced timer on changes


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
    $('.tpl-post-list .item').each((_, item) => {
      const $item = $(item),
        $title = $item.find('.item-title--text'),
        text = $title.text()
      console.log('title', text)
      if (text.startsWith('RE: ')) $title.text(text.substr(4))
    })
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
        mutationsList.forEach(mutation => {
          if (mutation.type === 'childList') {
            console.log('A child node has been added or removed.', mutation)
          } else if (mutation.type === 'attributes') {
            console.log('The ' + mutation.attributeName + ' attribute was modified.')
          }
        })
      },
      observer = new MutationObserver(callback)

    observer.observe(rootNode, config)
  }


  initialize()
  watchChanges()
})
