/* eslint-disable react/prop-types */
import React/*, { Text }*/ from 'react';
import { FaSquare, FaCheckSquare, FaMinusSquare } from "react-icons/fa";
import { IoMdArrowDropright } from "react-icons/io";
import TreeView, { flattenTree } from "react-accessible-treeview";
import Dropdown from 'react-dropdown';
import 'react-dropdown/style.css';
import cx from "classnames";
import "./Certificator.css";
import axios from 'axios';
import { Anchorme } from 'react-anchorme'

import { MdCheck, MdClose } from "react-icons/md";

const getKitsUrl = 'http://localhost:8400/api/kits';

class Certificator extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loadingKits: true,
      loadingTree: true,
      treeMode: undefined, // disabled or edit

      kits: [],
      selectedKit: undefined,
      runningKit: undefined,

      treeData: [],
      selectedTest: undefined,
      checkedTests: [],
      userTreeState: undefined
    };
  }

  componentDidMount() {
    this.initialLoadKits()
    setInterval(() => this.updateKits(), 1000);
  }

  async initialLoadKits() {
    await axios.get(getKitsUrl).then((res) => {
      const kits = res.data.kits;
      const runningKit = kits.find(kit => kit.status === 'in-progress');
      const completedKits = kits.filter(kit => kit.status === 'completed');
      let selectedKit = undefined;
      if (this.state.selectedKit) {
        selectedKit = kits.find(kit => kit.id === this.state.selectedKit.id);
      } else if (runningKit) {
        selectedKit = runningKit
      } else if (completedKits.length > 0) {
        selectedKit = completedKits[0]
      } else if (kits.length > 0) {
        selectedKit = kits[0]
      }
      this.setState({
        loadingKits: false,
        loadingTree: true,
        kits: kits,
        selectedKit: selectedKit,
        runningKit: runningKit,
      }, () => this.initialLoadTree())
    });
  }

  async initialLoadTree() {
    if (!this.state.selectedKit) return;
    const kitId = this.state.selectedKit.id;
    await axios.get(`${getKitsUrl}/${kitId}`).then((res) => {
      if (!this.state.selectedKit || kitId !== this.state.selectedKit.id) return
      const tree = res.data;
      const flatTree = flattenTree(tree);
      const selectedKitStatus = this.state.selectedKit.status;
      const treeMode = (selectedKitStatus === 'completed' || selectedKitStatus === 'aborted') ? 'disabled' : 'edit'
      let checkedTests;
      if (treeMode === 'disabled') {
        checkedTests = /*this.state.checkedTests.length > 0 ? this.state.checkedTests :*/
          flatTree.reduce((acc, node) => {
            if (node.metadata?.status !== 'skipped' && node.parent && !node.isBranch) {
              acc.push(node.id)
            }
            return acc;
          }, [])
      } else {
        checkedTests = flatTree.map(node => node.id)
      }
      this.setState({
        loadingTree: false,
        treeData: flatTree,
        checkedTests: checkedTests,
        selectedTest: undefined,
        treeMode: treeMode,
        userTreeState: undefined,
      })
    });
  }

  async updateKits() {
    await axios.get(getKitsUrl).then((res) => {
      const kits = res.data.kits;
      const runningKit = kits.find(kit => kit.status === 'in-progress');
      this.setState({
        kits: kits,
        runningKit: runningKit,
      }, () => this.updateTree())
    });
  }

  async updateTree() {
    if (!this.state.selectedKit) return;
    const kitId = this.state.selectedKit.id;
    await axios.get(`${getKitsUrl}/${kitId}`).then((res) => {
      if (!this.state.selectedKit || kitId !== this.state.selectedKit.id) return
      const tree = res.data;
      const flatTree = flattenTree(tree);
      this.setState({
        treeData: flatTree,
      })
    });
  }

  onKitSelected(option) {
    const selectedKit = this.state.kits.find(kit => kit.id === option.value);
    this.setState({
      selectedKit: selectedKit,
      loadingTree: true,
    }, () => this.initialLoadTree())
  }

  async onRunClicked() {
    console.log(this.getCheckedIds())
    await axios.post(`${getKitsUrl}/$run`,
      {
        kitId: this.state.selectedKit.id,
        selected: this.getCheckedIds()
      }
    ).then(() => this.updateKits());
  }

  async onAbortClicked() {
    await axios.post(`${getKitsUrl}/$abort`
    ).then(() => this.updateKits());
  }

  async onNewClicked() {
    await axios.post(`${getKitsUrl}/$stash`
    ).then(() => this.updateKits());
  }

  getCheckedIds() {
    if (this.state.userTreeState) {
      const checkedIds = []
      console.log(this.state.userTreeState)
      for (const selectedId of this.state.userTreeState.selectedIds) {
        const node = this.state.treeData.find(node => node.id === selectedId);
        if (node.children.length === 0) {
          checkedIds.push(selectedId);
        }
      }
      return checkedIds;
    }
    return this.state.checkedTests;
  }

  render() {
    return (
      <div>
        {!this.state.loadingKits && this.state.selectedKit &&
          <div className="kit-section">
            <div className="dropdown">
              <div className="dropdown-title">Test Kit:</div>
              <Dropdown
                options={this.state.kits.map(kit => { return { value: kit.id, label: kit.name } })}
                value={this.state.selectedKit.id}
                onChange={(option) => this.onKitSelected(option)}
              />
              <div className="status-title">{this.state.selectedKit.status}</div>
            </div>
            <div className="description">{this.state.selectedKit.description}</div>
          </div>
        }
        <div className="content">
          <div className="checkbox">
            {!this.state.loadingTree && this.state.treeData.length > 0 &&
              <TreeView
                data={this.state.treeData}
                defaultExpandedIds={this.state.treeData.map(node => node.id)}
                selectedIds={this.state.checkedTests}
                aria-label="Checkbox tree"
                multiSelect
                propagateSelect
                propagateSelectUpwards
                togglableSelect
                onSelect={({ treeState }) => this.setState({ userTreeState: treeState })}
                nodeRenderer={({
                  element,
                  isBranch,
                  isExpanded,
                  isSelected,
                  isHalfSelected,
                  getNodeProps,
                  level,
                  handleExpand,
                  handleSelect,
                }) => {
                  return (
                    <div className="node"
                      {...getNodeProps({
                        onClick: (e) => {
                          handleExpand(e)
                          this.setState({
                            selectedTest:
                              element.children.length > 0 ||
                                this.state.selectedTest && element.id === this.state.selectedTest.id ?
                                undefined :
                                element
                          })
                        }
                      })}
                      style={{ marginLeft: 40 * (level - 1) }}
                    >
                      {isBranch && <ArrowIcon isOpen={isExpanded} />}
                      <div className='item'>
                        <CheckBoxIcon
                          className="checkbox-icon"
                          onClick={(e) => {
                            if (!this.state.runningKit && this.state.treeMode === 'edit') {
                              handleSelect(e)
                            }
                            e.stopPropagation();
                          }}
                          variant={
                            isHalfSelected ? "some" : isSelected ? "all" : "none"
                          }
                          disabled={true}
                          style={{ opacity: !this.state.runningKit && this.state.treeMode === 'edit' ? 1 : 0.5 }}
                        />
                        <div className="name" style={{ fontWeight: element.name === this.state.selectedTest?.name ? 600 : 400 }}>{element.name}</div>
                        {element.metadata?.status === 'in-progress' && <div className="loader"></div>}
                        {(element.metadata?.status === 'passed' || element.metadata?.status === 'completed') && <MdCheck color="green"></MdCheck>}
                        {(element.metadata?.status === 'failed' || element.metadata?.status === 'error') && <MdClose color="red"></MdClose>}
                      </div>
                    </div>
                  );
                }}
              />}
          </div>
          {!this.state.loadingTree && this.state.selectedTest !== undefined &&
            (<div className="properties">
              {Object.keys(this.state.selectedTest.metadata).map(key =>
                <div key={key} className="property">
                  <span className="property-key">{key === 'status' ? 'Status' : key}: </span>
                  <span className="property-value">
                    <Anchorme target="_blank">{this.state.selectedTest.metadata[key]}</Anchorme>
                  </span>
                </div>
              )}
            </div>)
          }
        </div>
        {!this.state.loadingTree &&
          <span>
            {!this.state.runningKit && this.state.treeMode === 'disabled' &&
              <button className="new" onClick={async () => { await this.onNewClicked() }}>New</button>
            }
            {!this.state.runningKit && this.state.treeMode === 'edit' &&
              <button className="run"
                disabled={this.getCheckedIds().length === 0}
                onClick={async () => { await this.onRunClicked() }}>Run</button>
            }
            {this.state.runningKit && this.state.runningKit.id === this.state.selectedKit.id &&
              <button className="abort" onClick={async () => { await this.onAbortClicked() }}>Abort</button>
            }
          </span>
        }
      </div>
    );
  }
}

const ArrowIcon = ({ isOpen, className }) => {
  const baseClass = "arrow";
  const classes = cx(
    baseClass,
    { [`${baseClass}--closed`]: !isOpen },
    { [`${baseClass}--open`]: isOpen },
    className
  );
  return <IoMdArrowDropright className={classes} />;
};

const CheckBoxIcon = ({ variant, ...rest }) => {
  switch (variant) {
    case "all":
      return <FaCheckSquare {...rest} />;
    case "none":
      return <FaSquare {...rest} />;
    case "some":
      return <FaMinusSquare {...rest} />;
    default:
      return null;
  }
};

export default Certificator;