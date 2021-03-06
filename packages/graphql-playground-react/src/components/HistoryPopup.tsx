import * as React from 'react'
import * as Modal from 'react-modal'
import HistoryHeader from './HistoryPopup/HistoryHeader'
import { HistoryFilter } from '../types'
import HistoryItems from './HistoryPopup/HistoryItems'
import { Icon } from 'graphcool-styles'
import { modalStyle } from '../constants'
import { withTheme, LocalThemeInterface } from './Theme'
import * as cn from 'classnames'
import { QueryEditor } from './Playground/QueryEditor'
import { styled } from '../styled'
import * as theme from 'styled-theming'
import { connect } from 'react-redux'
import { createStructuredSelector } from 'reselect'
import { getHistory } from '../state/history/selectors'
import { getHistoryOpen } from '../state/general/selectors'
import { closeHistory, openHistory } from '../state/general/actions'
import { duplicateSession } from '../state/sessions/actions'
import { toggleHistoryItemStarring } from '../state/history/actions'
import { Session } from '../state/sessions/reducers'
import { OrderedMap } from 'immutable'

export interface ReduxProps {
  isOpen: boolean
  closeHistory: () => void
  items: OrderedMap<string, Session>
  toggleHistoryItemStarring: (sessionId: string) => void
  duplicateSession: (session: Session) => void
}

export interface State {
  selectedFilter: HistoryFilter
  selectedItemIndex: string
  searchTerm: string
}

class HistoryPopup extends React.Component<
  ReduxProps & LocalThemeInterface,
  State
> {
  constructor(props: ReduxProps & LocalThemeInterface) {
    super(props)
    const selectedItemIndex = props.items.keySeq().first() || ''
    this.state = {
      selectedFilter: 'HISTORY',
      selectedItemIndex,
      searchTerm: '',
    }
  }
  render() {
    const { searchTerm, selectedFilter } = this.state
    const { localTheme } = this.props
    const items = this.props.items.filter(item => {
      return selectedFilter === 'STARRED'
        ? item.starred
        : true &&
            (searchTerm && searchTerm.length > 0
              ? item.query.toLowerCase().includes(searchTerm.toLowerCase())
              : true)
    })

    const selectedItem = this.props.items.get(
      this.state.selectedItemIndex!,
    )!.toJS()
    let customModalStyle = modalStyle
    if (localTheme === 'light') {
      customModalStyle = {
        ...modalStyle,
        overlay: {
          ...modalStyle.overlay,
          backgroundColor: 'rgba(255,255,255,0.9)',
        },
      }
    }

    return (
      <Modal
        isOpen={this.props.isOpen}
        onRequestClose={this.props.closeHistory}
        contentLabel="GraphiQL Session History"
        style={customModalStyle}
      >
        <Wrapper className={localTheme}>
          <Left>
            <HistoryHeader
              onSelectFilter={this.handleSelectFilter}
              selectedFilter={this.state.selectedFilter}
              onSearch={this.handleSearch}
            />
            <HistoryItems
              items={items}
              selectedItemIndex={this.state.selectedItemIndex}
              searchTerm={this.state.searchTerm}
              onItemSelect={this.handleItemSelect}
              onItemStarToggled={this.props.toggleHistoryItemStarring}
            />
          </Left>
          {Boolean(selectedItem) ? (
            <Right>
              <RightHeader>
                <View />
                <Use onClick={this.handleClickUse}>
                  <UseText>Use</UseText>
                  <Icon
                    src={require('../assets/icons/arrowRight.svg')}
                    color="white"
                    stroke={true}
                    width={13}
                    height={13}
                  />
                </Use>
              </RightHeader>
              <Big
                className={cn({
                  'docs-graphiql': localTheme === 'light',
                })}
              >
                <GraphiqlWrapper
                  className={cn({
                    'graphiql-wrapper': localTheme === 'light',
                  })}
                >
                  <div className="graphiql-container">
                    <div className="queryWrap">
                      <QueryEditor value={selectedItem.query} />
                    </div>
                  </div>
                </GraphiqlWrapper>
              </Big>
            </Right>
          ) : (
            <Right>
              <RightEmpty>
                <RightEmptyText>No History yet</RightEmptyText>
              </RightEmpty>
            </Right>
          )}
        </Wrapper>
      </Modal>
    )
  }

  private handleClickUse = () => {
    const { items } = this.props
    const selectedItem = items.get(this.state.selectedItemIndex)!
    this.props.duplicateSession(selectedItem)
    this.props.closeHistory()
  }

  private handleItemSelect = (index: string) => {
    this.setState({ selectedItemIndex: index } as State)
  }

  private handleSelectFilter = (filter: HistoryFilter) => {
    this.setState({ selectedFilter: filter } as State)
  }

  private handleSearch = (term: string) => {
    this.setState({ searchTerm: term } as State)
  }
}

const mapStateToProps = createStructuredSelector({
  items: getHistory,
  isOpen: getHistoryOpen,
})

export default withTheme<{}>(
  connect(mapStateToProps, {
    closeHistory,
    openHistory,
    duplicateSession,
    toggleHistoryItemStarring,
  })(HistoryPopup),
)

const Wrapper = styled.div`
  display: flex;
  min-height: 500px;

  & .graphiql-container.graphiql-container {
    height: calc(100% - 81px) !important;

    & .queryWrap.queryWrap {
      border-top: none;
    }
  }
`

const Left = styled.div`
  flex: 1;

  background: white;
`

const Right = styled.div`
  flex: 0 0 464px;
  z-index: 2;
`

const rightBackgroundColor = theme('mode', {
  light: '#f6f7f7',
  dark: p => p.theme.colours.darkBlue,
})

const RightHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  padding-left: ${p => p.theme.sizes.medium25};
  padding-right: ${p => p.theme.sizes.medium25};
  padding-top: 20px;
  padding-bottom: 20px;

  background: ${rightBackgroundColor};
`

const RightEmpty = styled.div`
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;

  background: ${rightBackgroundColor};
`

const color = theme('mode', {
  dark: p => p.theme.colours.white60,
  light: p => p.theme.colours.darkBlue60,
})

const RightEmptyText = styled.div`
  font-size: 16px;
  color: ${color};
`

const View = styled.div`
  font-size: ${p => p.theme.sizes.fontSmall};
  font-weight: ${p => p.theme.sizes.fontSemiBold};
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.4);
`

const Use = styled.div`
  display: flex;
  align-items: center;

  padding-top: ${p => p.theme.sizes.small10};
  padding-bottom: ${p => p.theme.sizes.small10};
  padding-left: ${p => p.theme.sizes.small16};
  padding-right: ${p => p.theme.sizes.small16};

  font-size: ${p => p.theme.sizes.fontSmall};
  font-weight: ${p => p.theme.sizes.fontSemiBold};

  border-radius: ${p => p.theme.sizes.smallRadius};
  background: ${p => p.theme.colours.green};
  cursor: pointer;
`

const UseText = styled.div`
  margin-right: ${p => p.theme.sizes.small6};
  color: white;
`

const Big = styled.div`
  height: 100%;
  display: flex;
  flex: 1 1 auto;
`

const GraphiqlWrapper = Big.extend`
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex: 1 1 auto;
`
