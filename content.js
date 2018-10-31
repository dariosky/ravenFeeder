$(function () {
  let updateTimer, //debounced timer on changes
    lockUpdates = false,
    colorStyles = 'background: #AAF; color: #333'

  function markAllAsRead(e) {
    const $issue = $(e.target).closest('.issue'),
      $commentMarks = $issue.find('.mark-as-read:not(.mark-all-as-read)')
    console.info(`%cMark ${$commentMarks.length} as read`, colorStyles)
    e.stopPropagation()
    $commentMarks.click()
  }

  function goToFirstComment(e) {
    console.info('%cGo to first comment', colorStyles)
    const $issue = $(e.target).closest('.issue'),
      $first = $issue.find('.item-title').first()
    $first.click()
  }

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

    $('body')
      .on('click', '.issueHeader .mark-all-as-read', markAllAsRead)
      .on('click', '.issueHeader', goToFirstComment)
  }

  function updatePosts() {
    lockUpdates = true
    console.info('%cUpdating posts ****', colorStyles)

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
    console.info(`%c${commentsCount} comments on ${issueBlocks.length} issues`,
      colorStyles)

    // $listContainer.empty()

    $listContainer.append(issueBlocks.map(
      block => $('<div/>')
        .addClass('issue')
        .append(
          $('<div/>').addClass('issueHeader').append(
            $(`<div class="issueNumber">${block.issue}</div>`),
            $(`<div class="issueTitle">${block.title}</div>`),
            $('<div class="issueCommands">' +
              '  <div class="tpl-count-group">' +
              '    <div class="mark-as-read mark-all-as-read green-button--extra">' +
              '      All read ✔' +
              '    </div>' +
              '  </div>' +
              '</div>'),
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
