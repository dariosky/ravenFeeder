$(function () {
  let updateTimer, //debounced timer on changes
    lockUpdates = false

  function initialize() {
    const logoUrl = chrome.runtime.getURL('images/rprss128.png')
    $('.feeder-logo')
      .css({
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
    lockUpdates = true
    console.log('Updating posts ****')

    // the bottom ad post is added all the time - then - remove it all the time
    $('.popup-container').attr('style', 'height: auto !important; width: 450px;')
    $('#post-upgrade_post').remove()

    const $listContainer = $('.tpl-post-list'),
      $listItems = $listContainer.find('.list-item'),// array of listItems
      issueBlocks = [],
      issueMaps = {}
    let
      commentsCount = 0

    $listItems.each(
      (_, listItem) => {
        const
          $listItem = $(listItem),
          $item = $listItem.find('.item'),
          $itemText = $item.find('.item-title--text'),
          $text = $itemText.text(),
          issueGroups = $text.match(/^RE: \[(.*)] (.*)/)
        if (issueGroups) {
          commentsCount++
          const [_, issue, title] = issueGroups

          $itemText.remove() // get rid of the title
          $item.find('.item-sub-title').remove()

          if (!issueMaps[issue]) {
            issueMaps[issue] = {
              issue,
              title,
              children: [],
            }
            issueBlocks.push(issueMaps[issue])//keep the ordered list
          }
          issueMaps[issue].children.push($listItem)
          $listItem.removeClass('even odd') // after sorting zebra would be random
          // console.log(issue, title)
        }
      },
    )
    console.info(`${commentsCount} comments on ${issueBlocks.length} issues`)

    $listContainer.empty()
    $listContainer.append(issueBlocks.map(
      block => $('<div/>')
        .addClass('issue')
        .append(
          $('<div/>').addClass('issueHeader').append(
            $(`<div class="issueNumber">${block.issue}</div>`),
            $(`<div class="issueTitle">${block.title}</div>`),
          ),
          block.children,
        ),
    ))

    setTimeout(() => {
      // unlock updates from text tick
      lockUpdates = false
    }, 0)
  }


  function watchChanges() {
    const MutationObserver =
      window.MutationObserver || window.WebKitMutationObserver,
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
              if (
                nodeClasses &&
                (nodeClasses.contains('list-item') ||
                  nodeClasses.contains('tpl-post-list'))
              ) {
                clearTimeout(updateTimer) //debounced
                updateTimer = setTimeout(updatePosts, 100)
              }
            })
            // console.log ('A child node has been added or removed.', mutation);
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
