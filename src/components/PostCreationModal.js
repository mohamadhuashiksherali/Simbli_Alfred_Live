import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './PostCreationModal.css';
import refreshIcon from './asset/refresh.png';
import addIcon from './asset/add.png';
import robotImage from './asset/roobots.png';
import linkedinIcon from './asset/lnkedin.svg';
import twitterIcon from './asset/twiter.svg';
import instagramIcon from './asset/insta.svg';
import facebookIcon from './asset/facebook.svg';
import global from "./asset/global.png";

const PostCreationModal = ({ show, onHide }) => {
  const [selectedPlatform, setSelectedPlatform] = useState('linkedin');
  const [hashtags, setHashtags] = useState(['#Ai', '#Technology', '#Innovation']);
  const [newHashtag, setNewHashtag] = useState('');

  const handleHashtagSubmit = (e) => {
    if (e.key === 'Enter' && newHashtag.trim()) {
      setHashtags([...hashtags, newHashtag.trim()]);
      setNewHashtag('');
    }
  };

  const platforms = [
    { id: 'linkedin', name: 'LinkedIn', logo: linkedinIcon, characters: '3000 Characters', selected: true },
    { id: 'twitter', name: 'X(Twitter)', logo: twitterIcon, characters: '280 Characters', selected: false },
    { id: 'instagram', name: 'Instagram', logo: instagramIcon, characters: '3000 Characters', selected: false },
    { id: 'facebook', name: 'Facebook', logo: facebookIcon, characters: '280 Characters', selected: false }
  ];

  return (
    <>
      <style>
        {

          `
        .post-time {

    font-weight: 400;
    background: unset;
    padding: unset;
    border-radius: 4px;
    border: unset;
    margin-top:-2px;
}
        `
        }
      </style>
      <Modal
        show={show}
        onHide={onHide}
        size="lg"
        centered
        className="post-creation-modal"
      >
        <Modal.Header className="modal-header-custom">
          <div className="user-info">
            <div className="avatar">V</div>
            <div className="user-details">
              <h6 className="user-name">Vinoth Kumar</h6>
              <p className="user-title mb-0 pb-0">Entrepreneur & CEO | AI Enthusiast | Building</p>
              <span className="post-time ">Just now • <img src={global} style={{ objectFit: "contain", width: "10px", height: "10px" }}></img></span>
            </div>
          </div>
          <button
            type="button"
            className="btn-close-custom"
            onClick={onHide}
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </Modal.Header>

        <Modal.Body className="modal-body-custom">

          <div className="content-area">
            <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry.</p>
            <p>Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.</p>
            <p>Lorem Ipsum has been the industry:</p>
            <ol>
              <li>Lorem Ipsum has been the industry's standard dummy</li>
              <li>text ever since the 1500s.</li>
            </ol>
          </div>


          <div className="hashtags-section">
            <div className="existing-hashtags">
              {hashtags.map((tag, index) => (
                <span key={index} className="hashtag-pill">{tag}</span>
              ))}
              <span className="more-hashtags">+2 more</span>
            </div>
            <input
              type="text"
              className="hashtag-input"
              placeholder="# Add New Hashtags and Press Enter"
              value={newHashtag}
              onChange={(e) => setNewHashtag(e.target.value)}
              onKeyPress={handleHashtagSubmit}
            />
          </div>


          <div className="image-preview">
            <div className="image-container">
              <div className="robot-image">
                <img src={robotImage} alt="Robot" className="robot-img" />
              </div>
              <div className="image-controls">
                <button className="control-btn refresh">
                  <img src={refreshIcon} alt="Refresh" className="control-icon" />
                </button>
                <button className="control-btn upload">
                  <img src={addIcon} alt="Add" className="control-icon" />
                </button>
              </div>
            </div>
          </div>


          <div className="platform-selection mt-4">
            <h6>Select Platform:</h6>
            <div className="platform-cards">
              {platforms.map((platform) => (
                <div
                  key={platform.id}
                  className={`platform-card ${platform.id === selectedPlatform ? 'selected' : ''}`}
                  data-platform={platform.id}
                  onClick={() => setSelectedPlatform(platform.id)}
                >
                  <div className="platform-logo">
                    {platform.id === 'linkedin' ? (
                      <svg width="30" height="30" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg" className="platform-icon linkedin-svg">
                        <path d="M10.355 0C4.63582 0 0 4.63582 0 10.355C0 16.0736 4.63582 20.7101 10.355 20.7101C16.0742 20.7101 20.7101 16.0736 20.7101 10.355C20.7101 4.63582 16.0742 0 10.355 0Z" fill="white" className="linkedin-bg" />
                        <path d="M15.7228 14.8481V10.8763C15.7228 8.74831 14.587 7.75811 13.0719 7.75811C11.8494 7.75811 11.3019 8.43054 10.997 8.90234V7.92055H8.69435C8.72476 8.57098 8.69435 14.8481 8.69435 14.8481H10.997V10.9792C10.997 10.7727 11.0119 10.5656 11.0728 10.4181C11.2391 10.0045 11.6177 9.57606 12.2539 9.57606C13.0875 9.57606 13.4208 10.211 13.4208 11.1423V14.8487L15.7228 14.8481ZM6.26803 6.97501C7.07055 6.97501 7.57083 6.44237 7.57083 5.77771C7.55594 5.09816 7.07055 4.58105 6.28292 4.58105C5.49529 4.58105 4.98077 5.09816 4.98077 5.77771C4.98077 6.44302 5.4804 6.97501 6.2538 6.97501H6.26803ZM7.41938 14.8481V7.92055H5.11733V14.8481H7.41938Z" fill="#0077b5" className="linkedin-symbol" />
                      </svg>
                    ) : (
                      <img src={platform.logo} alt={platform.name} className="platform-icon" />
                    )}
                    {platform.id === selectedPlatform && (platform.id === 'linkedin' || platform.id === 'twitter') && <span className="lightning">⚡</span>}
                  </div>
                  <div className="platform-info">
                    <span className="platform-name">{platform.name}</span>
                    <span className="platform-chars">{platform.characters}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>


          <div className="action-buttons">
            <Button variant="secondary" className="schedule-btn">Schedule</Button>
            <Button variant="success" className="publish-btn">Publish Now</Button>
          </div>
        </Modal.Body>

        <Modal.Footer className="modal-footer-custom">
          <Button variant="dark" className="save-btn">Save</Button>
          <Button variant="outline-secondary" className="cancel-btn">Cancel</Button>
        </Modal.Footer>
      </Modal></>
  );
};

export default PostCreationModal;
